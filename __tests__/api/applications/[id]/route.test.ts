/**
 * 応募API PATCH テスト
 * PATCH /api/applications/[id] - 応募ステータスの更新（取消し）
 */

import { NextRequest } from "next/server";
import { PATCH } from "@/app/api/applications/[id]/route";
import { mockSession, mockGetSession } from "../../../mocks/auth";
import { createMockTalent } from "../../../mocks/kintone";

// モジュールのモック
jest.mock("@/lib/auth-server", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/lib/kintone/client", () => ({
  createApplicationClient: jest.fn(),
  getAppIds: jest.fn(() => ({ application: 84 })),
}));

jest.mock("@/lib/kintone/services/application", () => ({
  updateApplicationStatus: jest.fn(),
}));

jest.mock("@/lib/kintone/services/talent", () => ({
  getTalentByAuthUserId: jest.fn(),
}));

jest.mock("@/lib/email", () => ({
  sendApplicationCancelEmail: jest.fn(),
}));

// モック関数の取得
const { getSession } = jest.requireMock("@/lib/auth-server");
const { createApplicationClient } = jest.requireMock("@/lib/kintone/client");
const { updateApplicationStatus } = jest.requireMock(
  "@/lib/kintone/services/application"
);
const { getTalentByAuthUserId } = jest.requireMock("@/lib/kintone/services/talent");
const { sendApplicationCancelEmail } = jest.requireMock("@/lib/email");

/**
 * テスト用リクエストを作成
 */
const createRequest = (body: object): NextRequest => {
  return new NextRequest("http://localhost:3000/api/applications/app-1", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

/**
 * テスト用パラメータを作成
 */
const createParams = (id: string) => Promise.resolve({ id });

describe("PATCH /api/applications/[id]", () => {
  // モックKintoneクライアント
  let mockClient: {
    record: {
      getRecords: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトで認証済み状態
    getSession.mockResolvedValue(mockSession);

    // Kintoneクライアントのモック
    mockClient = {
      record: {
        getRecords: jest.fn(),
      },
    };
    createApplicationClient.mockReturnValue(mockClient);

    // デフォルトの応募レコード（応募済み状態）
    mockClient.record.getRecords.mockResolvedValue({
      records: [
        {
          $id: { value: "app-1" },
          対応状況: { value: "応募済み" },
          案件名: { value: "React開発者募集" },
        },
      ],
    });

    // その他のモック
    updateApplicationStatus.mockResolvedValue(undefined);
    getTalentByAuthUserId.mockResolvedValue(createMockTalent());
    sendApplicationCancelEmail.mockResolvedValue({ success: true });
  });

  describe("正常系", () => {
    it("応募を取り消せる", async () => {
      const request = createRequest({ status: "応募取消し" });
      const response = await PATCH(request, { params: createParams("app-1") });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("応募取消し時にステータス更新関数が呼ばれる", async () => {
      const request = createRequest({ status: "応募取消し" });
      await PATCH(request, { params: createParams("app-1") });

      expect(updateApplicationStatus).toHaveBeenCalledWith("app-1", "応募取消し");
    });

    it("応募取消し時にメールを送信する", async () => {
      const request = createRequest({ status: "応募取消し" });
      await PATCH(request, { params: createParams("app-1") });

      expect(sendApplicationCancelEmail).toHaveBeenCalledWith(
        mockSession.user.email,
        "テスト 太郎",
        "React開発者募集",
        expect.any(String)
      );
    });
  });

  describe("認証エラー", () => {
    it("未認証の場合は401を返す", async () => {
      getSession.mockResolvedValue(null);

      const request = createRequest({ status: "応募取消し" });
      const response = await PATCH(request, { params: createParams("app-1") });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("バリデーションエラー", () => {
    it("ステータス未指定の場合は400を返す", async () => {
      const request = createRequest({});
      const response = await PATCH(request, { params: createParams("app-1") });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("ステータスが指定されていません");
    });
  });

  describe("権限エラー", () => {
    it("他人の応募は404を返す", async () => {
      // 応募が見つからない（他人のものなのでクエリに一致しない）
      mockClient.record.getRecords.mockResolvedValue({ records: [] });

      const request = createRequest({ status: "応募取消し" });
      const response = await PATCH(request, { params: createParams("app-999") });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Application not found");
    });

    it("存在しない応募は404を返す", async () => {
      mockClient.record.getRecords.mockResolvedValue({ records: [] });

      const request = createRequest({ status: "応募取消し" });
      const response = await PATCH(request, { params: createParams("app-nonexistent") });

      expect(response.status).toBe(404);
    });
  });

  describe("ステータス制約エラー", () => {
    it("応募済み以外のステータスからの取消しは400を返す", async () => {
      // 面談調整中の状態
      mockClient.record.getRecords.mockResolvedValue({
        records: [
          {
            $id: { value: "app-1" },
            対応状況: { value: "面談調整中" },
            案件名: { value: "React開発者募集" },
          },
        ],
      });

      const request = createRequest({ status: "応募取消し" });
      const response = await PATCH(request, { params: createParams("app-1") });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("この応募は取り消せません");
    });

    it("案件決定状態からの取消しは400を返す", async () => {
      mockClient.record.getRecords.mockResolvedValue({
        records: [
          {
            $id: { value: "app-1" },
            対応状況: { value: "案件決定" },
            案件名: { value: "React開発者募集" },
          },
        ],
      });

      const request = createRequest({ status: "応募取消し" });
      const response = await PATCH(request, { params: createParams("app-1") });

      expect(response.status).toBe(400);
    });
  });

  describe("Kintoneエラー", () => {
    it("ステータス更新時のKintoneエラーは500を返す", async () => {
      updateApplicationStatus.mockRejectedValue(new Error("Kintone API Error"));

      const request = createRequest({ status: "応募取消し" });
      const response = await PATCH(request, { params: createParams("app-1") });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("応募ステータスの更新に失敗しました");
    });

    it("応募取得時のKintoneエラーは500を返す", async () => {
      mockClient.record.getRecords.mockRejectedValue(new Error("Kintone API Error"));

      const request = createRequest({ status: "応募取消し" });
      const response = await PATCH(request, { params: createParams("app-1") });

      expect(response.status).toBe(500);
    });
  });

  describe("ユーザー名の決定ロジック", () => {
    it("姓名がある場合は姓名を使用", async () => {
      getTalentByAuthUserId.mockResolvedValue(
        createMockTalent({ lastName: "山田", firstName: "花子" })
      );

      const request = createRequest({ status: "応募取消し" });
      await PATCH(request, { params: createParams("app-1") });

      expect(sendApplicationCancelEmail).toHaveBeenCalledWith(
        mockSession.user.email,
        "山田 花子",
        expect.any(String),
        expect.any(String)
      );
    });

    it("talentデータがない場合はセッションの名前を使用", async () => {
      getTalentByAuthUserId.mockResolvedValue(null);

      const request = createRequest({ status: "応募取消し" });
      await PATCH(request, { params: createParams("app-1") });

      expect(sendApplicationCancelEmail).toHaveBeenCalledWith(
        mockSession.user.email,
        mockSession.user.name,
        expect.any(String),
        expect.any(String)
      );
    });
  });
});
