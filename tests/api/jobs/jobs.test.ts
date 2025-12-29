import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// モックデータ
const mockSession = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
  },
}

const mockJobs = [
  {
    id: "1",
    title: "React開発案件",
    features: ["フルリモート可", "長期案件"],
    position: ["フロントエンドエンジニア"],
    skills: ["React", "TypeScript"],
    description: "ECサイトのフロントエンド開発",
    environment: "MacBook, VS Code",
    notes: "",
    requiredSkills: "React経験3年以上",
    preferredSkills: "TypeScript経験",
    location: "東京都渋谷区",
    nearestStation: "渋谷駅",
    minHours: "140",
    maxHours: "180",
    period: "長期",
    rate: "800000",
    interviewCount: "1回",
    remote: "フルリモート",
    recruitmentStatus: "募集中",
    isNew: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Java Spring案件",
    features: ["リモート併用可", "高単価"],
    position: ["バックエンドエンジニア"],
    skills: ["Java", "Spring Boot"],
    description: "基幹システム開発",
    environment: "Windows",
    notes: "",
    requiredSkills: "Java経験5年以上",
    preferredSkills: "Spring Boot経験",
    location: "東京都港区",
    nearestStation: "六本木駅",
    minHours: "160",
    maxHours: "200",
    period: "6ヶ月",
    rate: "900000",
    interviewCount: "2回",
    remote: "リモート併用",
    recruitmentStatus: "募集中",
    isNew: false,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "クローズ案件",
    features: [],
    position: ["エンジニア"],
    skills: [],
    description: "終了した案件",
    environment: "",
    notes: "",
    requiredSkills: "",
    preferredSkills: "",
    location: "大阪府",
    nearestStation: "",
    minHours: "",
    maxHours: "",
    period: "",
    rate: "700000",
    interviewCount: "",
    remote: "",
    recruitmentStatus: "クローズ",
    isNew: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    title: "Python案件",
    features: ["常駐案件"],
    position: ["データエンジニア"],
    skills: ["Python", "Django"],
    description: "データ分析基盤構築",
    environment: "Linux",
    notes: "",
    requiredSkills: "Python経験2年以上",
    preferredSkills: "",
    location: "東京都千代田区",
    nearestStation: "東京駅",
    minHours: "140",
    maxHours: "180",
    period: "3ヶ月",
    rate: "750000",
    interviewCount: "1回",
    remote: "常駐",
    recruitmentStatus: "募集中",
    isNew: true,
    createdAt: new Date().toISOString(),
  },
]

const mockRecommendations: { records: unknown[] } = {
  records: [],
}

// モックを定義
vi.mock("@/lib/auth-server", () => ({
  getSession: vi.fn(() => mockSession),
}))

vi.mock("@/lib/kintone/services/job", () => ({
  getAllJobs: vi.fn(() => mockJobs),
  getJobById: vi.fn(),
}))

vi.mock("@/lib/kintone/services/application", () => ({
  getApplicationsByAuthUserId: vi.fn(() => []),
}))

vi.mock("@/lib/kintone/services/recommendation", () => ({
  getRecommendationScoreMap: vi.fn(() => ({})),
}))

vi.mock("@/lib/kintone/client", () => ({
  createRecommendationClient: vi.fn(() => ({
    record: {
      getRecords: vi.fn(() => mockRecommendations),
    },
  })),
  getAppIds: vi.fn(() => ({
    job: "1",
    recommendation: "2",
  })),
}))

// テスト対象をインポート
import { GET } from "@/app/api/jobs/route"
import { GET as GET_JOB_DETAIL } from "@/app/api/jobs/[id]/route"
import { getSession } from "@/lib/auth-server"
import { getAllJobs, getJobById } from "@/lib/kintone/services/job"
import { getApplicationsByAuthUserId } from "@/lib/kintone/services/application"

describe("GET /api/jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(getAllJobs).mockResolvedValue(mockJobs)
    vi.mocked(getApplicationsByAuthUserId).mockResolvedValue([])
  })

  describe("3.1.1 全案件取得", () => {
    it("全ての公開案件が取得できる（クローズ案件は除外）", async () => {
      const request = new NextRequest("http://localhost:3000/api/jobs")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toBeDefined()
      // クローズ案件（id: 3）は除外される
      expect(data.items.length).toBe(3)
      expect(data.items.every((job: { recruitmentStatus: string }) => job.recruitmentStatus !== "クローズ")).toBe(true)
    })

    it("未認証ユーザーでも案件一覧を取得できる", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const request = new NextRequest("http://localhost:3000/api/jobs")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items.length).toBe(3) // クローズ除外
    })
  })

  describe("3.1.2 ページネーション", () => {
    it("skip/limit指定で適切にページングされる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/jobs?skip=1&limit=2"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items.length).toBe(2)
      expect(data.total).toBe(3) // 総件数（クローズ除外後）
    })

    it("limit=0の場合、全件が返される（skipは無視）", async () => {
      const request = new NextRequest("http://localhost:3000/api/jobs?skip=2&limit=0")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // limit=0は「制限なし」の意味で全件返却
      expect(data.items.length).toBe(3)
    })
  })

  describe("3.1.3 キーワード検索", () => {
    it("案件名でキーワード検索ができる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/jobs?query=React"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items.length).toBe(1)
      expect(data.items[0].title).toContain("React")
    })

    it("スキルでキーワード検索ができる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/jobs?query=TypeScript"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items.length).toBeGreaterThan(0)
    })

    it("複数キーワード（AND検索）が正しく動作する", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/jobs?query=React TypeScript"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // ReactとTypeScript両方を含む案件のみ
      expect(data.items.length).toBe(1)
    })

    it("該当なしの場合、空配列が返される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/jobs?query=COBOL"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items.length).toBe(0)
    })
  })

  describe("3.1.4 職種フィルター", () => {
    it("選択した職種の案件のみ表示される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/jobs?positions=フロントエンド"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // フロントエンドエンジニアを含む案件のみ
      expect(data.items.every((job: { position: string[] }) =>
        job.position.some(p => p.includes("フロントエンド"))
      )).toBe(true)
    })
  })

  describe("3.1.5 リモート可否フィルター", () => {
    it("フルリモート案件のみ表示される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/jobs?remote=フルリモート可"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items.every((job: { features: string[] }) =>
        job.features.includes("フルリモート可")
      )).toBe(true)
    })
  })

  describe("3.1.6 勤務地フィルター", () => {
    it("指定したエリアの案件のみ表示される", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/jobs?location=渋谷"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items.every((job: { location: string }) =>
        job.location.includes("渋谷")
      )).toBe(true)
    })

    it("最寄駅で検索ができる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/jobs?nearestStation=東京"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items.every((job: { nearestStation: string }) =>
        job.nearestStation.includes("東京")
      )).toBe(true)
    })
  })

  describe("3.1.7 並び替え", () => {
    it("新着順でソートできる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/jobs?sort=new"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // 新着順は作成日時の降順
      for (let i = 0; i < data.items.length - 1; i++) {
        const current = new Date(data.items[i].createdAt).getTime()
        const next = new Date(data.items[i + 1].createdAt).getTime()
        expect(current).toBeGreaterThanOrEqual(next)
      }
    })

    it("単価が高い順でソートできる", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/jobs?sort=price"
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // 単価降順
      for (let i = 0; i < data.items.length - 1; i++) {
        const currentRate = parseInt(data.items[i].rate, 10) || 0
        const nextRate = parseInt(data.items[i + 1].rate, 10) || 0
        expect(currentRate).toBeGreaterThanOrEqual(nextRate)
      }
    })

    it("おすすめ順でソートできる（デフォルト）", async () => {
      const request = new NextRequest("http://localhost:3000/api/jobs")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toBeDefined()
    })
  })

  describe("3.3.1 応募済み案件の除外", () => {
    it("応募済みの案件は一覧から除外される", async () => {
      // 案件ID: 1に応募済みとする
      vi.mocked(getApplicationsByAuthUserId).mockResolvedValueOnce([
        {
          id: "app-1",
          jobId: "1",
          status: "応募中",
          talentId: "talent-1",
          authUserId: "test-user-id",
          appliedAt: new Date().toISOString(),
          resumeText: "",
          appealText: "",
        },
      ])

      const request = new NextRequest("http://localhost:3000/api/jobs")

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // 案件ID: 1は除外される
      expect(data.items.find((job: { id: string }) => job.id === "1")).toBeUndefined()
    })
  })
})

describe("GET /api/jobs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("3.2.1 案件詳細取得", () => {
    it("存在する案件の詳細が取得できる", async () => {
      const mockJobDetail = mockJobs[0]
      vi.mocked(getJobById).mockResolvedValueOnce(mockJobDetail)

      const request = new NextRequest("http://localhost:3000/api/jobs/1")
      const response = await GET_JOB_DETAIL(request, {
        params: Promise.resolve({ id: "1" }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe("1")
      expect(data.title).toBe("React開発案件")
    })
  })

  describe("3.2.2 存在しない案件", () => {
    it("存在しない案件IDで404エラーが返される", async () => {
      vi.mocked(getJobById).mockResolvedValueOnce(null)

      const request = new NextRequest("http://localhost:3000/api/jobs/99999")
      const response = await GET_JOB_DETAIL(request, {
        params: Promise.resolve({ id: "99999" }),
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("案件が見つかりません")
    })
  })

  describe("3.3.2 クローズ案件の詳細表示", () => {
    it("クローズ案件でも直接アクセスでは詳細が表示できる", async () => {
      const closedJob = mockJobs[2] // クローズ案件
      vi.mocked(getJobById).mockResolvedValueOnce(closedJob)

      const request = new NextRequest("http://localhost:3000/api/jobs/3")
      const response = await GET_JOB_DETAIL(request, {
        params: Promise.resolve({ id: "3" }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe("3")
      expect(data.recruitmentStatus).toBe("クローズ")
    })
  })
})
