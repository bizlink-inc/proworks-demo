import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// モックを先に定義
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signUpEmail: vi.fn(),
    },
  },
  generateRandomPassword: vi.fn(() => "random-password-123"),
}))

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}))

// テスト対象をインポート
import { POST } from "@/app/api/auth/signup-with-email/route"
import { auth } from "@/lib/auth"

describe("POST /api/auth/signup-with-email", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("1.1.1 正常な登録", () => {
    it("必須項目が入力された場合、ユーザーが登録される", async () => {
      // auth.api.signUpEmail が成功するようにモック
      vi.mocked(auth.api.signUpEmail).mockResolvedValueOnce(undefined)

      const request = new NextRequest(
        "http://localhost:3000/api/auth/signup-with-email",
        {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
            lastName: "山田",
            firstName: "太郎",
            phone: "090-1234-5678",
            birthDate: "1990-01-01",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe("認証メールを送信しました")
      expect(data.email).toBe("test@example.com")

      // auth.api.signUpEmail が呼ばれたことを確認
      expect(auth.api.signUpEmail).toHaveBeenCalledTimes(1)
      expect(auth.api.signUpEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            email: "test@example.com",
            password: "password123",
            name: "山田 太郎",
            lastName: "山田",
            firstName: "太郎",
            phone: "090-1234-5678",
            birthDate: "1990-01-01",
          }),
        })
      )
    })

    it("サインアップデータがクッキーに保存される", async () => {
      vi.mocked(auth.api.signUpEmail).mockResolvedValueOnce(undefined)

      const request = new NextRequest(
        "http://localhost:3000/api/auth/signup-with-email",
        {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
            lastName: "山田",
            firstName: "太郎",
            phone: "090-1234-5678",
            birthDate: "1990-01-01",
          }),
        }
      )

      const response = await POST(request)

      // クッキーが設定されていることを確認
      const cookies = response.cookies.getAll()
      const signupDataCookie = cookies.find((c) => c.name === "pw_signup_data")
      expect(signupDataCookie).toBeDefined()

      if (signupDataCookie) {
        const signupData = JSON.parse(signupDataCookie.value)
        expect(signupData.lastName).toBe("山田")
        expect(signupData.firstName).toBe("太郎")
      }
    })

    it("rememberMeが有効な場合、保持クッキーが設定される", async () => {
      vi.mocked(auth.api.signUpEmail).mockResolvedValueOnce(undefined)

      const request = new NextRequest(
        "http://localhost:3000/api/auth/signup-with-email",
        {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
            lastName: "山田",
            firstName: "太郎",
            rememberMe: true,
          }),
        }
      )

      const response = await POST(request)

      const cookies = response.cookies.getAll()
      const rememberCookie = cookies.find(
        (c) => c.name === "pw_signup_remember"
      )
      expect(rememberCookie).toBeDefined()
      expect(rememberCookie?.value).toBe("test@example.com")
    })
  })

  describe("1.1.3 既存メールアドレスでのエラー", () => {
    it("既に登録済みのメールアドレスでエラーが返される", async () => {
      // 重複エラーをシミュレート
      vi.mocked(auth.api.signUpEmail).mockRejectedValueOnce(
        new Error("User with this email already exists")
      )

      const request = new NextRequest(
        "http://localhost:3000/api/auth/signup-with-email",
        {
          method: "POST",
          body: JSON.stringify({
            email: "existing@example.com",
            password: "password123",
            lastName: "田中",
            firstName: "花子",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("このメールアドレスは既に登録されています。")
    })
  })

  describe("1.1.4 無効なメールアドレス", () => {
    it("メールアドレスが空の場合、バリデーションエラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/signup-with-email",
        {
          method: "POST",
          body: JSON.stringify({
            email: "",
            password: "password123",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("メールアドレスが必要です")
    })

    it("メールアドレスがundefinedの場合、バリデーションエラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/signup-with-email",
        {
          method: "POST",
          body: JSON.stringify({
            password: "password123",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("メールアドレスが必要です")
    })
  })

  describe("パスワード未指定時の動作", () => {
    it("パスワードが未指定の場合、ランダムパスワードが生成される", async () => {
      vi.mocked(auth.api.signUpEmail).mockResolvedValueOnce(undefined)

      const request = new NextRequest(
        "http://localhost:3000/api/auth/signup-with-email",
        {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            lastName: "山田",
            firstName: "太郎",
          }),
        }
      )

      const response = await POST(request)

      expect(response.status).toBe(200)
      // ランダムパスワードが使用されたことを確認
      expect(auth.api.signUpEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            password: "random-password-123",
          }),
        })
      )
    })
  })

  describe("エラーハンドリング", () => {
    it("予期しないエラーが発生した場合、500エラーが返される", async () => {
      vi.mocked(auth.api.signUpEmail).mockRejectedValueOnce(
        new Error("Unexpected error")
      )

      const request = new NextRequest(
        "http://localhost:3000/api/auth/signup-with-email",
        {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe("Unexpected error")
    })
  })
})
