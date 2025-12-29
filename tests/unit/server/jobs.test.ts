/**
 * SSR用案件取得関数のユニットテスト
 *
 * このテストは以下を検証:
 * - 応募済み案件が正しく除外される
 * - クローズ案件が除外される
 * - 未認証ユーザーでも案件が取得できる
 * - ページネーションが正しく動作する
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// モックデータ
const mockJobs = [
  {
    id: "1",
    title: "React開発案件",
    recruitmentStatus: "募集中",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Java Spring案件",
    recruitmentStatus: "募集中",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "クローズ案件",
    recruitmentStatus: "クローズ",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    title: "Python案件",
    recruitmentStatus: "募集中",
    createdAt: new Date().toISOString(),
  },
]

// モック定義
vi.mock("@/lib/kintone/services/job", () => ({
  getAllJobs: vi.fn(() => mockJobs),
}))

vi.mock("@/lib/kintone/services/application", () => ({
  getAppliedJobIdsByAuthUserId: vi.fn(() => []),
}))

vi.mock("@/lib/kintone/client", () => ({
  createRecommendationClient: vi.fn(() => ({
    record: {
      getRecords: vi.fn(() => ({ records: [] })),
    },
  })),
  getAppIds: vi.fn(() => ({
    job: "1",
    recommendation: "2",
  })),
}))

// テスト対象をインポート
import { getJobsWithRecommendations } from "@/lib/server/jobs"
import { getAllJobs } from "@/lib/kintone/services/job"
import { getAppliedJobIdsByAuthUserId } from "@/lib/kintone/services/application"

describe("getJobsWithRecommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAllJobs).mockResolvedValue(mockJobs)
    vi.mocked(getAppliedJobIdsByAuthUserId).mockResolvedValue([])
  })

  describe("基本機能", () => {
    it("全ての公開案件が取得できる（クローズ案件は除外）", async () => {
      const result = await getJobsWithRecommendations()

      // クローズ案件（id: 3）は除外される
      expect(result.items.length).toBe(3)
      expect(result.items.every((job) => job.recruitmentStatus !== "クローズ")).toBe(true)
    })

    it("未認証ユーザーでも案件一覧を取得できる", async () => {
      const result = await getJobsWithRecommendations(undefined)

      expect(result.items.length).toBe(3) // クローズ除外
      // getAppliedJobIdsByAuthUserIdは呼ばれない
      expect(getAppliedJobIdsByAuthUserId).not.toHaveBeenCalled()
    })

    it("total と totalAll が正しく設定される", async () => {
      const result = await getJobsWithRecommendations()

      expect(result.total).toBe(3) // クローズ除外後
      expect(result.totalAll).toBe(3)
    })
  })

  describe("応募済み案件の除外", () => {
    it("応募済みの案件は一覧から除外される", async () => {
      // 案件ID: 1に応募済みとする
      vi.mocked(getAppliedJobIdsByAuthUserId).mockResolvedValueOnce(["1"])

      const result = await getJobsWithRecommendations("test-user-id")

      // 案件ID: 1は除外される
      expect(result.items.find((job) => job.id === "1")).toBeUndefined()
      // 残りの案件は表示される（2件、3はクローズで除外）
      expect(result.items.length).toBe(2)
    })

    it("複数の応募済み案件が全て除外される", async () => {
      // 案件ID: 1と2に応募済みとする
      vi.mocked(getAppliedJobIdsByAuthUserId).mockResolvedValueOnce(["1", "2"])

      const result = await getJobsWithRecommendations("test-user-id")

      // 案件ID: 1と2は除外、残りは4のみ（3はクローズで除外）
      expect(result.items.length).toBe(1)
      expect(result.items[0].id).toBe("4")
    })

    it("getAppliedJobIdsByAuthUserIdが正しく呼び出される", async () => {
      const authUserId = "test-user-123"

      await getJobsWithRecommendations(authUserId)

      expect(getAppliedJobIdsByAuthUserId).toHaveBeenCalledWith(authUserId)
    })
  })

  describe("ページネーション", () => {
    it("skip と limit で適切にページングされる", async () => {
      const result = await getJobsWithRecommendations(undefined, { skip: 1, limit: 2 })

      expect(result.items.length).toBe(2)
      expect(result.total).toBe(3) // 総件数
    })

    it("limit が 0 の場合、空配列が返される", async () => {
      const result = await getJobsWithRecommendations(undefined, { skip: 0, limit: 0 })

      expect(result.items.length).toBe(0)
    })

    it("skip が総件数を超える場合、空配列が返される", async () => {
      const result = await getJobsWithRecommendations(undefined, { skip: 100, limit: 10 })

      expect(result.items.length).toBe(0)
    })
  })

  describe("応募除外とページネーションの組み合わせ", () => {
    it("応募済み除外後にページネーションが適用される", async () => {
      // 案件ID: 1に応募済み
      vi.mocked(getAppliedJobIdsByAuthUserId).mockResolvedValueOnce(["1"])

      const result = await getJobsWithRecommendations("test-user-id", { skip: 0, limit: 1 })

      // 応募済み（ID: 1）除外後の最初の1件
      expect(result.items.length).toBe(1)
      expect(result.items[0].id).not.toBe("1")
      expect(result.total).toBe(2) // 応募済み除外後の総件数
    })
  })
})
