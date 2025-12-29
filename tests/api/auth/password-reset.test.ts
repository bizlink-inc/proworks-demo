import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

// fetchをモック
const mockFetch = vi.fn()
global.fetch = mockFetch

// テスト対象をインポート
import { POST } from "@/app/api/auth/forgot-password/route"

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトで成功レスポンスを返す
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("1.3.1 パスワードリセット申請", () => {
    it("メールアドレスを指定してリセットを申請できる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe("パスワードリセットメールを送信しました")
    })

    it("存在しないメールアドレスでも成功メッセージが返される（セキュリティ対策）", async () => {
      // APIがエラーを返す場合でも成功メッセージを返す
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: "User not found" }),
      })

      const request = new NextRequest(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: "nonexistent@example.com",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      // セキュリティ上、成功メッセージを返す
      expect(response.status).toBe(200)
      expect(data.message).toBe("パスワードリセットメールを送信しました")
    })
  })

  describe("バリデーション", () => {
    it("メールアドレスが空の場合、エラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: "",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("メールアドレスが必要です")
    })

    it("メールアドレスが未指定の場合、エラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("メールアドレスが必要です")
    })
  })

  describe("エラーハンドリング", () => {
    it("内部エラーが発生しても成功メッセージが返される（セキュリティ対策）", async () => {
      // fetchが例外をスローする場合
      mockFetch.mockRejectedValueOnce(new Error("Network error"))

      const request = new NextRequest(
        "http://localhost:3000/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({
            email: "test@example.com",
          }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      // セキュリティ上、成功メッセージを返す
      expect(response.status).toBe(200)
      expect(data.message).toBe("パスワードリセットメールを送信しました")
    })
  })
})
