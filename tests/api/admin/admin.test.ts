import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// モックを定義
vi.mock("@/lib/admin-auth", () => ({
  verifyAdminCredentials: vi.fn(),
  createAdminSession: vi.fn().mockResolvedValue(undefined),
  verifyAdminSession: vi.fn(),
}))

vi.mock("@/lib/db/client", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => []),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue(undefined),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  })),
  schema: {
    appSettings: {},
  },
}))

// テスト対象をインポート
import { POST as adminLogin } from "@/app/api/admin/login/route"
import { GET as getBatchSettings, POST as updateBatchSettings } from "@/app/api/admin/batch-settings/route"
import { verifyAdminCredentials, verifyAdminSession } from "@/lib/admin-auth"

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("8.1.1 管理者ログイン", () => {
    it("正しい認証情報でログインできる", async () => {
      vi.mocked(verifyAdminCredentials).mockReturnValue(true)

      const request = new NextRequest(
        "http://localhost:3000/api/admin/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: "admin@example.com",
            password: "admin-password",
          }),
        }
      )

      const response = await adminLogin(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe("ログイン成功")
    })

    it("間違った認証情報でログインできない", async () => {
      vi.mocked(verifyAdminCredentials).mockReturnValue(false)

      const request = new NextRequest(
        "http://localhost:3000/api/admin/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: "admin@example.com",
            password: "wrong-password",
          }),
        }
      )

      const response = await adminLogin(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("メールアドレスまたはパスワードが正しくありません")
    })
  })

  describe("8.1.2 ログインバリデーション", () => {
    it("メールアドレスが空の場合エラー", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: "",
            password: "password",
          }),
        }
      )

      const response = await adminLogin(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("メールアドレスとパスワードを入力してください")
    })

    it("パスワードが空の場合エラー", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/login",
        {
          method: "POST",
          body: JSON.stringify({
            email: "admin@example.com",
            password: "",
          }),
        }
      )

      const response = await adminLogin(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("メールアドレスとパスワードを入力してください")
    })
  })
})

describe("GET /api/admin/batch-settings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("8.4.1 バッチ設定取得", () => {
    it("認証済みの場合、設定を取得できる", async () => {
      vi.mocked(verifyAdminSession).mockResolvedValue(true)

      const response = await getBatchSettings()
      const data = await response.json()

      expect(response.status).toBe(200)
      // デフォルト設定が返される
      expect(data.scoreThreshold).toBeDefined()
    })

    it("未認証の場合、401エラーが返される", async () => {
      vi.mocked(verifyAdminSession).mockResolvedValue(false)

      const response = await getBatchSettings()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("認証が必要です")
    })
  })
})

describe("POST /api/admin/batch-settings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(verifyAdminSession).mockResolvedValue(true)
  })

  describe("8.4.2 バッチ設定更新", () => {
    it("有効な閾値で設定を更新できる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/batch-settings",
        {
          method: "POST",
          body: JSON.stringify({
            scoreThreshold: 5,
            maxPerJob: 100,
          }),
        }
      )

      const response = await updateBatchSettings(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.scoreThreshold).toBe(5)
    })

    it("閾値が範囲外の場合エラー（負の値）", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/batch-settings",
        {
          method: "POST",
          body: JSON.stringify({
            scoreThreshold: -1,
          }),
        }
      )

      const response = await updateBatchSettings(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("スコア閾値は0〜20の範囲で指定してください")
    })

    it("閾値が範囲外の場合エラー（上限超過）", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/batch-settings",
        {
          method: "POST",
          body: JSON.stringify({
            scoreThreshold: 25,
          }),
        }
      )

      const response = await updateBatchSettings(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("スコア閾値は0〜20の範囲で指定してください")
    })

    it("maxPerJobが範囲外の場合エラー", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/admin/batch-settings",
        {
          method: "POST",
          body: JSON.stringify({
            scoreThreshold: 5,
            maxPerJob: 500,
          }),
        }
      )

      const response = await updateBatchSettings(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("1案件あたりの最大数は1〜200の範囲で指定してください")
    })
  })

  describe("認証チェック", () => {
    it("未認証の場合、401エラーが返される", async () => {
      vi.mocked(verifyAdminSession).mockResolvedValue(false)

      const request = new NextRequest(
        "http://localhost:3000/api/admin/batch-settings",
        {
          method: "POST",
          body: JSON.stringify({
            scoreThreshold: 5,
          }),
        }
      )

      const response = await updateBatchSettings(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("認証が必要です")
    })
  })
})
