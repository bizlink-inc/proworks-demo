/**
 * 案件一覧から応募済み案件を除外する統合テスト
 * 実際のKintone開発環境に接続してテスト
 *
 * このテストは以下のバグを防ぐ:
 * - 応募後も案件一覧に表示され続ける
 * - 応募済み案件が正しく除外されない
 */

import { describe, test, expect, beforeAll, afterAll } from "vitest"
import {
  verifyKintoneConfig,
  verifyMocksDisabled,
  TEST_PREFIX,
} from "../helpers/kintone-setup"
import {
  createDefaultTestData,
  trackCreatedApplication,
} from "../helpers/seed-data"
import { cleanupTrackedRecords } from "../helpers/cleanup"
import { createApplication } from "@/lib/kintone/services/application"
import { getAppliedJobIdsByAuthUserId } from "@/lib/kintone/services/application"
import { getAllJobs } from "@/lib/kintone/services/job"

// テストデータ
let testData: {
  testUserId: string
  talentId: string
  jobAId: string
  jobBId: string
}

describe("案件一覧からの応募済み除外テスト", () => {
  beforeAll(async () => {
    // 環境チェック
    verifyKintoneConfig()
    verifyMocksDisabled()

    // テストデータ作成
    console.log("\n📦 テストデータを作成中...")
    testData = await createDefaultTestData()
    console.log(`   テストユーザーID: ${testData.testUserId}`)
    console.log(`   案件A ID: ${testData.jobAId}`)
    console.log(`   案件B ID: ${testData.jobBId}`)
    console.log("")
  }, 60000)

  afterAll(async () => {
    // クリーンアップ
    console.log("\n🧹 テストデータをクリーンアップ中...")
    await cleanupTrackedRecords()
  }, 60000)

  describe("1. 応募前の状態確認", () => {
    test("応募前は全ての案件が取得できる", async () => {
      // 1. 案件一覧を取得
      const allJobs = await getAllJobs()

      // 2. 案件AとBが含まれている
      const hasJobA = allJobs.some((job) => job.id === testData.jobAId)
      const hasJobB = allJobs.some((job) => job.id === testData.jobBId)

      expect(hasJobA).toBe(true)
      expect(hasJobB).toBe(true)
    }, 30000)

    test("新規ユーザーは応募済み案件がない", async () => {
      // テストユーザーの応募済み案件IDを取得
      const appliedJobIds = await getAppliedJobIdsByAuthUserId(testData.testUserId)

      // 新規ユーザーなので空配列
      expect(appliedJobIds).toEqual([])
    }, 30000)
  })

  describe("2. 応募後の除外確認", () => {
    test("応募した案件が応募済み案件リストに追加される", async () => {
      // 1. 案件Aに応募
      const applicationId = await createApplication({
        authUserId: testData.testUserId,
        jobId: testData.jobAId,
      })
      trackCreatedApplication(applicationId)
      console.log(`   応募作成: ID=${applicationId}`)

      // 2. 応募済み案件IDを取得
      const appliedJobIds = await getAppliedJobIdsByAuthUserId(testData.testUserId)
      console.log(`   応募済み案件IDs: ${JSON.stringify(appliedJobIds)}`)

      // 3. 案件Aが含まれている
      expect(appliedJobIds).toContain(testData.jobAId)
    }, 30000)

    test("応募済み案件を除外した案件一覧を取得できる", async () => {
      // 1. 全案件を取得
      const allJobs = await getAllJobs()

      // 2. 応募済み案件IDを取得
      const appliedJobIds = await getAppliedJobIdsByAuthUserId(testData.testUserId)

      // 3. 応募済み案件を除外
      const filteredJobs = allJobs.filter((job) => !appliedJobIds.includes(job.id))

      // 4. 案件Aは除外されている
      const hasJobA = filteredJobs.some((job) => job.id === testData.jobAId)
      expect(hasJobA).toBe(false)

      // 5. 案件Bはまだ含まれている
      const hasJobB = filteredJobs.some((job) => job.id === testData.jobBId)
      expect(hasJobB).toBe(true)
    }, 30000)
  })

  describe("3. 複数応募の除外確認", () => {
    test("複数の案件に応募した場合、全て除外される", async () => {
      // 1. 案件Bにも応募
      const applicationId = await createApplication({
        authUserId: testData.testUserId,
        jobId: testData.jobBId,
      })
      trackCreatedApplication(applicationId)
      console.log(`   追加応募作成: ID=${applicationId}`)

      // 2. 応募済み案件IDを取得
      const appliedJobIds = await getAppliedJobIdsByAuthUserId(testData.testUserId)
      console.log(`   応募済み案件IDs: ${JSON.stringify(appliedJobIds)}`)

      // 3. 案件AとBの両方が含まれている
      expect(appliedJobIds).toContain(testData.jobAId)
      expect(appliedJobIds).toContain(testData.jobBId)

      // 4. 全案件から応募済みを除外
      const allJobs = await getAllJobs()
      const filteredJobs = allJobs.filter((job) => !appliedJobIds.includes(job.id))

      // 5. 案件AとBの両方が除外されている
      const hasJobA = filteredJobs.some((job) => job.id === testData.jobAId)
      const hasJobB = filteredJobs.some((job) => job.id === testData.jobBId)
      expect(hasJobA).toBe(false)
      expect(hasJobB).toBe(false)
    }, 30000)
  })
})
