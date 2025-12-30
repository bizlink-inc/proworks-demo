import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

// モックを定義
const mockSession = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "テストユーザー",
  },
}

const mockChangePassword = vi.fn()
const mockGetSession = vi.fn()

// next/headersをモック
vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      changePassword: (...args: unknown[]) => mockChangePassword(...args),
    },
  },
}))

vi.mock("@/lib/email", () => ({
  sendPasswordChangedNotificationEmail: vi.fn().mockResolvedValue({ success: true }),
}))

// テスト対象をインポート
import { POST } from "@/app/api/auth/change-password/route"

describe("POST /api/auth/change-password", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトでセッションあり、パスワード変更成功
    mockGetSession.mockResolvedValue(mockSession)
    mockChangePassword.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("1.2.1 パスワード変更（ログイン後）", () => {
    it("現在のパスワードと新しいパスワードを指定してパスワードを変更できる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "OldPassword123!",
            newPassword: "NewPassword456!",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe("パスワードが変更されました")
    })

    it("パスワード変更成功後、通知メールが送信される", async () => {
      const { sendPasswordChangedNotificationEmail } = await import("@/lib/email")

      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "OldPassword123!",
            newPassword: "NewPassword456!",
          }),
        }
      )

      await POST(request)

      expect(sendPasswordChangedNotificationEmail).toHaveBeenCalledWith(
        "test@example.com",
        "テストユーザー",
        expect.any(String)
      )
    })
  })

  describe("認証チェック", () => {
    it("未認証の場合、401エラーが返される", async () => {
      mockGetSession.mockResolvedValueOnce(null)

      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "OldPassword123!",
            newPassword: "NewPassword456!",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("ログインが必要です")
    })
  })

  describe("バリデーション", () => {
    it("現在のパスワードが未入力の場合、エラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            newPassword: "NewPassword456!",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("現在のパスワードと新しいパスワードが必要です")
    })

    it("新しいパスワードが未入力の場合、エラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "OldPassword123!",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("現在のパスワードと新しいパスワードが必要です")
    })

    it("新しいパスワードが6文字未満の場合、エラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "OldPassword123!",
            newPassword: "Short",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("新しいパスワードは6文字以上である必要があります")
    })
  })

  describe("パスワード検証", () => {
    it("現在のパスワードが間違っている場合、エラーが返される", async () => {
      mockChangePassword.mockRejectedValueOnce(new Error("Invalid password"))

      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "WrongPassword!",
            newPassword: "NewPassword456!",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("現在のパスワードが正しくありません")
    })
  })

  describe("エラーハンドリング", () => {
    it("パスワード変更処理が失敗した場合、エラーが返される", async () => {
      mockChangePassword.mockResolvedValueOnce(null)

      const request = new NextRequest(
        "http://localhost:3000/api/auth/change-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword: "OldPassword123!",
            newPassword: "NewPassword456!",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("パスワード変更に失敗しました")
    })
  })
})
