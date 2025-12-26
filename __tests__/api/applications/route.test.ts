/**
 * 応募API POST テスト
 * POST /api/applications - 案件への応募作成
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/applications/route";
import {
  mockSession,
  mockGetSession,
  setAuthenticated,
  setUnauthenticated,
  resetAuthMocks,
} from "../../mocks/auth";
import {
  createMockJob,
  createMockTalent,
  mockGetJobById,
  mockCheckDuplicateApplication,
  mockCreateApplication,
  mockGetTalentByAuthUserId,
  mockSendApplicationCompleteEmail,
  resetKintoneMocks,
  setupDefaultMocks,
} from "../../mocks/kintone";

// モジュールのモック
jest.mock("@/lib/auth-server", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/lib/kintone/services/job", () => ({
  getJobById: jest.fn(),
}));

jest.mock("@/lib/kintone/services/application", () => ({
  createApplication: jest.fn(),
  checkDuplicateApplication: jest.fn(),
}));

jest.mock("@/lib/kintone/services/talent", () => ({
  getTalentByAuthUserId: jest.fn(),
}));

jest.mock("@/lib/email", () => ({
  sendApplicationCompleteEmail: jest.fn(),
}));

jest.mock("@/lib/utils/profile-validation", () => ({
  checkRequiredFields: jest.fn(() => []),
}));

// モック関数の取得
const { getSession } = jest.requireMock("@/lib/auth-server");
const { getJobById } = jest.requireMock("@/lib/kintone/services/job");
const { createApplication, checkDuplicateApplication } = jest.requireMock(
  "@/lib/kintone/services/application"
);
const { getTalentByAuthUserId } = jest.requireMock("@/lib/kintone/services/talent");
const { sendApplicationCompleteEmail } = jest.requireMock("@/lib/email");

/**
 * テスト用リクエストを作成
 */
const createRequest = (body: object): NextRequest => {
  return new NextRequest("http://localhost:3000/api/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

describe("POST /api/applications", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトで認証済み状態
    getSession.mockResolvedValue(mockSession);

    // デフォルトのモック設定
    getJobById.mockResolvedValue(createMockJob());
    checkDuplicateApplication.mockResolvedValue(false);
    createApplication.mockResolvedValue("app-new-1");
    getTalentByAuthUserId.mockResolvedValue(createMockTalent());
    sendApplicationCompleteEmail.mockResolvedValue({ success: true });
  });

  describe("正常系", () => {
    it("応募を作成できる", async () => {
      const request = createRequest({ jobId: "job-1" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("app-new-1");
      expect(data.jobTitle).toBe("React開発者募集");
      expect(data.appliedAt).toBeDefined();
    });

    it("応募作成時に案件取得と重複チェックを並列で実行する", async () => {
      const request = createRequest({ jobId: "job-1" });
      await POST(request);

      expect(getJobById).toHaveBeenCalledWith("job-1");
      expect(checkDuplicateApplication).toHaveBeenCalledWith(
        mockSession.user.id,
        "job-1"
      );
    });

    it("応募作成後にメールを送信する", async () => {
      const request = createRequest({ jobId: "job-1" });
      await POST(request);

      // Fire-and-forgetなので呼び出されたことを確認
      expect(sendApplicationCompleteEmail).toHaveBeenCalledWith(
        mockSession.user.email,
        "テスト 太郎",
        expect.any(String)
      );
    });

    it("必須項目が未入力の場合はmissingFieldsを返す", async () => {
      const { checkRequiredFields } = jest.requireMock(
        "@/lib/utils/profile-validation"
      );
      checkRequiredFields.mockReturnValue(["phone", "address"]);

      const request = createRequest({ jobId: "job-1" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.missingFields).toEqual(["phone", "address"]);
    });
  });

  describe("認証エラー", () => {
    it("未認証の場合は401を返す", async () => {
      getSession.mockResolvedValue(null);

      const request = createRequest({ jobId: "job-1" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("セッションにユーザーIDがない場合は401を返す", async () => {
      getSession.mockResolvedValue({ user: {} });

      const request = createRequest({ jobId: "job-1" });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe("案件エラー", () => {
    it("存在しない案件への応募は404を返す", async () => {
      getJobById.mockResolvedValue(null);

      const request = createRequest({ jobId: "job-999" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Job not found");
    });
  });

  describe("重複エラー", () => {
    it("重複応募は409を返す", async () => {
      checkDuplicateApplication.mockResolvedValue(true);

      const request = createRequest({ jobId: "job-1" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe("Already applied");
    });
  });

  describe("Kintoneエラー", () => {
    it("応募作成時のKintoneエラーは500を返す", async () => {
      createApplication.mockRejectedValue(new Error("Kintone API Error"));

      const request = createRequest({ jobId: "job-1" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("応募の作成に失敗しました");
    });

    it("案件取得時のエラーは500を返す", async () => {
      getJobById.mockRejectedValue(new Error("Kintone API Error"));

      const request = createRequest({ jobId: "job-1" });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });

  describe("ユーザー名の決定ロジック", () => {
    it("姓名がある場合は姓名を使用", async () => {
      getTalentByAuthUserId.mockResolvedValue(
        createMockTalent({ lastName: "山田", firstName: "花子" })
      );

      const request = createRequest({ jobId: "job-1" });
      await POST(request);

      expect(sendApplicationCompleteEmail).toHaveBeenCalledWith(
        mockSession.user.email,
        "山田 花子",
        expect.any(String)
      );
    });

    it("姓名がなくfullNameがある場合はfullNameを使用", async () => {
      getTalentByAuthUserId.mockResolvedValue(
        createMockTalent({ lastName: "", firstName: "", fullName: "鈴木一郎" })
      );

      const request = createRequest({ jobId: "job-1" });
      await POST(request);

      expect(sendApplicationCompleteEmail).toHaveBeenCalledWith(
        mockSession.user.email,
        "鈴木一郎",
        expect.any(String)
      );
    });

    it("talentデータがない場合はセッションの名前を使用", async () => {
      getTalentByAuthUserId.mockResolvedValue(null);

      const request = createRequest({ jobId: "job-1" });
      await POST(request);

      expect(sendApplicationCompleteEmail).toHaveBeenCalledWith(
        mockSession.user.email,
        mockSession.user.name,
        expect.any(String)
      );
    });
  });
});
