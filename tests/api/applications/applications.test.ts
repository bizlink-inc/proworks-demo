import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// モックデータ
const mockSession = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    name: "テストユーザー",
  },
}

const mockTalent = {
  id: "talent-1",
  authUserId: "test-user-id",
  fullName: "テスト太郎",
  lastName: "テスト",
  firstName: "太郎",
  email: "test@example.com",
}

const mockJob = {
  id: "1",
  title: "React開発案件",
  features: ["フルリモート可"],
  position: ["フロントエンドエンジニア"],
  skills: ["React", "TypeScript"],
  description: "ECサイトのフロントエンド開発",
  rate: "800000",
  recruitmentStatus: "募集中",
}

const mockApplications = [
  {
    id: "app-1",
    jobId: "1",
    status: "応募済み",
    talentId: "talent-1",
    authUserId: "test-user-id",
    appliedAt: new Date().toISOString(),
    resumeText: "",
    appealText: "",
  },
  {
    id: "app-2",
    jobId: "2",
    status: "面談中",
    talentId: "talent-1",
    authUserId: "test-user-id",
    appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    resumeText: "",
    appealText: "",
  },
]

// モックを定義
vi.mock("@/lib/auth-server", () => ({
  getSession: vi.fn(() => mockSession),
}))

vi.mock("@/lib/kintone/services/job", () => ({
  getJobById: vi.fn(() => mockJob),
  getJobsByIds: vi.fn(() => new Map([["1", mockJob]])),
}))

vi.mock("@/lib/kintone/services/application", () => ({
  createApplication: vi.fn(() => "new-app-id"),
  checkDuplicateApplication: vi.fn(() => false),
  getApplicationsByAuthUserId: vi.fn(() => mockApplications),
  updateApplicationStatus: vi.fn(),
}))

vi.mock("@/lib/kintone/services/talent", () => ({
  getTalentByAuthUserId: vi.fn(() => mockTalent),
}))

vi.mock("@/lib/email", () => ({
  sendApplicationCompleteEmail: vi.fn().mockResolvedValue(undefined),
  sendApplicationCancelEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/slack", () => ({
  sendApplicationNotification: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/utils/profile-validation", () => ({
  checkRequiredFields: vi.fn(() => []),
}))

// createApplicationClientのモック関数を保持
const mockGetRecords = vi.fn(() => ({
  records: [
    {
      $id: { value: "app-1" },
      対応状況: { value: "応募済み" },
      案件名: { value: "React開発案件" },
    },
  ],
}))

vi.mock("@/lib/kintone/client", () => ({
  createApplicationClient: vi.fn(() => ({
    record: {
      getRecords: mockGetRecords,
    },
  })),
  getAppIds: vi.fn(() => ({
    application: "84",
  })),
}))

// テスト対象をインポート
import { POST } from "@/app/api/applications/route"
import { GET } from "@/app/api/applications/me/route"
import { PATCH } from "@/app/api/applications/[id]/route"
import { getSession } from "@/lib/auth-server"
import { getJobById } from "@/lib/kintone/services/job"
import {
  createApplication,
  checkDuplicateApplication,
  getApplicationsByAuthUserId,
  updateApplicationStatus,
} from "@/lib/kintone/services/application"
import { sendApplicationCompleteEmail, sendApplicationCancelEmail } from "@/lib/email"
import { sendApplicationNotification } from "@/lib/slack"
import { checkRequiredFields } from "@/lib/utils/profile-validation"
import { createApplicationClient } from "@/lib/kintone/client"

describe("POST /api/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(getJobById).mockResolvedValue(mockJob)
    vi.mocked(checkDuplicateApplication).mockResolvedValue(false)
    vi.mocked(createApplication).mockResolvedValue("new-app-id")
    vi.mocked(checkRequiredFields).mockReturnValue([])
  })

  describe("4.1.1 案件への応募", () => {
    it("ログインユーザーが案件に応募できる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/applications",
        {
          method: "POST",
          body: JSON.stringify({ jobId: "1" }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe("new-app-id")
      expect(data.jobTitle).toBe("React開発案件")
      expect(createApplication).toHaveBeenCalledWith({
        authUserId: "test-user-id",
        jobId: "1",
      })
    })

    it("応募完了時にメールとSlack通知が送信される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/applications",
        {
          method: "POST",
          body: JSON.stringify({ jobId: "1" }),
        }
      )

      await POST(request)

      // 非同期で送信されるので、少し待つ
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(sendApplicationCompleteEmail).toHaveBeenCalled()
      expect(sendApplicationNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "テスト 太郎",
          jobTitle: "React開発案件",
        })
      )
    })
  })

  describe("4.1.2 応募時のプロフィール未完了警告", () => {
    it("プロフィールが未完了の場合、missingFieldsが返される", async () => {
      vi.mocked(checkRequiredFields).mockReturnValueOnce([
        "lastNameKana",
        "firstNameKana",
      ])

      const request = new NextRequest(
        "http://localhost:3000/api/applications",
        {
          method: "POST",
          body: JSON.stringify({ jobId: "1" }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.missingFields).toContain("lastNameKana")
      expect(data.missingFields).toContain("firstNameKana")
    })
  })

  describe("4.1.3 存在しない案件への応募", () => {
    it("存在しない案件への応募で404エラーが返される", async () => {
      vi.mocked(getJobById).mockResolvedValueOnce(null)

      const request = new NextRequest(
        "http://localhost:3000/api/applications",
        {
          method: "POST",
          body: JSON.stringify({ jobId: "99999" }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Job not found")
    })
  })

  describe("認証チェック", () => {
    it("未認証ユーザーは応募できない", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const request = new NextRequest(
        "http://localhost:3000/api/applications",
        {
          method: "POST",
          body: JSON.stringify({ jobId: "1" }),
        }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})

describe("GET /api/applications/me", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(getApplicationsByAuthUserId).mockResolvedValue(mockApplications)
  })

  describe("4.2.1 応募履歴一覧取得", () => {
    it("ログインユーザーの応募履歴が取得できる", async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(2)
      expect(data[0].status).toBe("応募済み")
      expect(data[1].status).toBe("面談中")
    })

    it("応募履歴に案件情報が含まれる", async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data[0].job).toBeDefined()
    })
  })

  describe("認証チェック", () => {
    it("未認証ユーザーは履歴を取得できない", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})

describe("PATCH /api/applications/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(updateApplicationStatus).mockResolvedValue(undefined)
    // デフォルトのモック設定（応募済みステータス）
    mockGetRecords.mockReturnValue({
      records: [
        {
          $id: { value: "app-1" },
          対応状況: { value: "応募済み" },
          案件名: { value: "React開発案件" },
        },
      ],
    })
  })

  describe("4.3.1 応募取消し", () => {
    it("応募済みのステータスを取消しに変更できる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "応募取消し" }),
        }
      )

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "app-1" }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(updateApplicationStatus).toHaveBeenCalledWith(
        "app-1",
        "応募取消し"
      )
    })

    it("応募取消し時にメールが送信される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "応募取消し" }),
        }
      )

      await PATCH(request, { params: Promise.resolve({ id: "app-1" }) })

      // 非同期で送信されるので、少し待つ
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(sendApplicationCancelEmail).toHaveBeenCalled()
    })
  })

  describe("4.3.2 取消し不可のケース", () => {
    it("面談中の応募は取り消せない", async () => {
      // 面談中のステータスを返すようにモック
      mockGetRecords.mockReturnValueOnce({
        records: [
          {
            $id: { value: "app-2" },
            対応状況: { value: "面談中" },
            案件名: { value: "Java案件" },
          },
        ],
      })

      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-2",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "応募取消し" }),
        }
      )

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "app-2" }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("この応募は取り消せません")
    })
  })

  describe("4.3.3 存在しない応募", () => {
    it("存在しない応募IDで404エラーが返される", async () => {
      mockGetRecords.mockReturnValueOnce({ records: [] })

      const request = new NextRequest(
        "http://localhost:3000/api/applications/not-found",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "応募取消し" }),
        }
      )

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "not-found" }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Application not found")
    })
  })

  describe("バリデーション", () => {
    it("ステータスが指定されていない場合エラーが返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1",
        {
          method: "PATCH",
          body: JSON.stringify({}),
        }
      )

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "app-1" }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("ステータスが指定されていません")
    })
  })

  describe("認証チェック", () => {
    it("未認証ユーザーはステータスを変更できない", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const request = new NextRequest(
        "http://localhost:3000/api/applications/app-1",
        {
          method: "PATCH",
          body: JSON.stringify({ status: "応募取消し" }),
        }
      )

      const response = await PATCH(request, {
        params: Promise.resolve({ id: "app-1" }),
      })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })
})
