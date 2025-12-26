/**
 * プロフィールAPI テスト
 * GET /api/me - プロフィール取得
 * PATCH /api/me - プロフィール更新
 */

import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/me/route";
import { mockSession } from "../../mocks/auth";
import { createMockTalent } from "../../mocks/kintone";

// モジュールのモック
jest.mock("@/lib/auth-server", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/lib/kintone/services/talent", () => ({
  getTalentByAuthUserId: jest.fn(),
  updateTalent: jest.fn(),
}));

// モック関数の取得
const { getSession } = jest.requireMock("@/lib/auth-server");
const { getTalentByAuthUserId, updateTalent } = jest.requireMock(
  "@/lib/kintone/services/talent"
);

/**
 * PATCH用テストリクエストを作成
 */
const createPatchRequest = (body: object): NextRequest => {
  return new NextRequest("http://localhost:3000/api/me", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

describe("GET /api/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSession.mockResolvedValue(mockSession);
    getTalentByAuthUserId.mockResolvedValue(createMockTalent());
  });

  describe("正常系", () => {
    it("プロフィールを取得できる", async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lastName).toBe("テスト");
      expect(data.firstName).toBe("太郎");
      expect(data.email).toBe("test@example.com");
    });

    it("auth_user_idでKintoneから取得する", async () => {
      await GET();

      expect(getTalentByAuthUserId).toHaveBeenCalledWith(mockSession.user.id);
    });
  });

  describe("認証エラー", () => {
    it("未認証の場合は401を返す", async () => {
      getSession.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("セッションにユーザーIDがない場合は401を返す", async () => {
      getSession.mockResolvedValue({ user: {} });

      const response = await GET();

      expect(response.status).toBe(401);
    });
  });

  describe("人材データエラー", () => {
    it("人材データが見つからない場合は404を返す", async () => {
      getTalentByAuthUserId.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Talent not found");
    });
  });

  describe("退会済みユーザー", () => {
    it("退会済みユーザーは403を返す", async () => {
      getTalentByAuthUserId.mockResolvedValue(
        createMockTalent({ st: "退会" })
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("このアカウントは退会済みです");
      expect(data.withdrawn).toBe(true);
    });
  });

  describe("Kintoneエラー", () => {
    it("Kintoneエラー時は500を返す", async () => {
      getTalentByAuthUserId.mockRejectedValue(new Error("Kintone API Error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("人材情報の取得に失敗しました");
    });
  });
});

describe("PATCH /api/me", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getSession.mockResolvedValue(mockSession);
    getTalentByAuthUserId.mockResolvedValue(createMockTalent());
    updateTalent.mockResolvedValue(undefined);
  });

  describe("正常系", () => {
    it("プロフィールを更新できる", async () => {
      const updateData = {
        phone: "090-9999-8888",
        address: "東京都港区南青山1-1-1",
      };

      const request = createPatchRequest(updateData);
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.phone).toBe("090-9999-8888");
      expect(data.address).toBe("東京都港区南青山1-1-1");
    });

    it("updateTalent関数が正しい引数で呼ばれる", async () => {
      const updateData = { phone: "090-9999-8888" };
      const talent = createMockTalent();
      getTalentByAuthUserId.mockResolvedValue(talent);

      const request = createPatchRequest(updateData);
      await PATCH(request);

      expect(updateTalent).toHaveBeenCalledWith(talent.id, updateData);
    });

    it("部分更新ができる（他のフィールドは維持）", async () => {
      const updateData = { phone: "090-1111-2222" };

      const request = createPatchRequest(updateData);
      const response = await PATCH(request);
      const data = await response.json();

      expect(data.phone).toBe("090-1111-2222");
      // 他のフィールドは元の値を維持
      expect(data.lastName).toBe("テスト");
      expect(data.email).toBe("test@example.com");
    });

    it("複数フィールドを同時に更新できる", async () => {
      const updateData = {
        lastName: "山田",
        firstName: "花子",
        phone: "090-5555-5555",
        skills: "Python, Django, AWS",
      };

      const request = createPatchRequest(updateData);
      const response = await PATCH(request);
      const data = await response.json();

      expect(data.lastName).toBe("山田");
      expect(data.firstName).toBe("花子");
      expect(data.phone).toBe("090-5555-5555");
      expect(data.skills).toBe("Python, Django, AWS");
    });
  });

  describe("認証エラー", () => {
    it("未認証の場合は401を返す", async () => {
      getSession.mockResolvedValue(null);

      const request = createPatchRequest({ phone: "090-9999-8888" });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("人材データエラー", () => {
    it("人材データが見つからない場合は404を返す", async () => {
      getTalentByAuthUserId.mockResolvedValue(null);

      const request = createPatchRequest({ phone: "090-9999-8888" });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Talent not found");
    });
  });

  describe("Kintoneエラー", () => {
    it("更新時のKintoneエラーは500を返す", async () => {
      updateTalent.mockRejectedValue(new Error("Kintone API Error"));

      const request = createPatchRequest({ phone: "090-9999-8888" });
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("人材情報の更新に失敗しました");
    });
  });
});
