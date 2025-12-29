import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

// モックを定義
const mockSession = {
  user: {
    id: "test-user-id",
    email: "current@example.com",
  },
}

const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        then: vi.fn((callback) => callback([])), // 既存ユーザーなし
      })),
    })),
  })),
  insert: vi.fn(() => ({
    values: vi.fn().mockResolvedValue(undefined),
  })),
}

vi.mock("@/lib/auth-server", () => ({
  getSession: vi.fn(() => mockSession),
}))

vi.mock("@/lib/db/client", () => ({
  getDb: vi.fn(() => mockDb),
}))

vi.mock("@/lib/email", () => ({
  sendEmailChangeVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
  logEmailToConsole: vi.fn(),
}))

// fetchをモック
const mockFetch = vi.fn()
global.fetch = mockFetch

// テスト対象をインポート
import { POST } from "@/app/api/auth/change-email/route"
import { getSession } from "@/lib/auth-server"

describe("POST /api/auth/change-email", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // パスワード検証成功のデフォルトモック
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: { id: "test-user-id" } }),
    })
    // セッションをリセット
    vi.mocked(getSession).mockResolvedValue(mockSession)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("1.4.1 メールアドレス変更申請", () => {
    it("正しい情報でメール変更を申請できる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-email",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "password123",
            newEmail: "new@example.com",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe("確認メールを送信しました")
    })
  })

  describe("認証チェック", () => {
    it("未認証の場合、401エラーが返される", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-email",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "password123",
            newEmail: "new@example.com",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("認証が必要です")
    })
  })

  describe("バリデーション", () => {
    it("パスワードが未入力の場合、エラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-email",
        {
          method: "POST",
          body: JSON.stringify({
            newEmail: "new@example.com",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("現在のパスワードと新しいメールアドレスが必要です")
    })

    it("新しいメールアドレスが未入力の場合、エラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-email",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "password123",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("現在のパスワードと新しいメールアドレスが必要です")
    })

    it("無効なメールアドレス形式の場合、エラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-email",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "password123",
            newEmail: "invalid-email",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("有効なメールアドレスを入力してください")
    })

    it("現在のメールアドレスと同じ場合、エラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-email",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "password123",
            newEmail: "current@example.com", // 現在のメールアドレス
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("現在のメールアドレスと同じです")
    })
  })

  describe("パスワード検証", () => {
    it("パスワードが間違っている場合、エラーが返される", async () => {
      // パスワード検証失敗
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "Invalid password" }),
      })

      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-email",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "wrong-password",
            newEmail: "new@example.com",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("現在のパスワードが正しくありません")
    })
  })
})
