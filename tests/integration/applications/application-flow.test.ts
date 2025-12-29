/**
 * 応募フロー統合テスト
 * 実際のKintone開発環境に接続して応募機能をテスト
 */

import { describe, test, expect, beforeAll, afterAll } from "vitest"
import {
  verifyKintoneConfig,
  verifyMocksDisabled,
  TEST_PREFIX,
} from "../helpers/kintone-setup"
import {
  createDefaultTestData,
  getApplicationFromKintone,
  findApplicationsByAuthUserId,
  trackCreatedApplication,
} from "../helpers/seed-data"
import { cleanupTrackedRecords } from "../helpers/cleanup"
import { createApplication, checkDuplicateApplication } from "@/lib/kintone/services/application"

// テストデータ
let testData: {
  testUserId: string
  talentId: string
  jobAId: string
  jobBId: string
}

describe("応募フロー統合テスト", () => {
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
  }, 60000) // タイムアウト60秒

  afterAll(async () => {
    // クリーンアップ
    console.log("\n🧹 テストデータをクリーンアップ中...")
    await cleanupTrackedRecords()
  }, 60000)

  describe("1. 応募レコード作成", () => {
    test("案件に応募するとKintoneにレコードが作成される", async () => {
      // 1. 応募を作成（実際のKintone API呼び出し）
      const applicationId = await createApplication({
        authUserId: testData.testUserId,
        jobId: testData.jobAId,
      })

      // 作成したレコードを追跡（クリーンアップ用）
      trackCreatedApplication(applicationId)

      // 2. レコードIDが返される
      expect(applicationId).toBeDefined()
      expect(applicationId).not.toBe("")

      // 3. Kintoneから直接取得して確認
      const record = await getApplicationFromKintone(applicationId)
      expect(record).not.toBeNull()
      expect(record?.authUserId).toBe(testData.testUserId)
      expect(record?.jobId).toBe(testData.jobAId)
      expect(record?.status).toBe("応募済み")
    }, 30000)

    test("応募時のステータスは「応募済み」になる", async () => {
      // 別の案件に応募
      const applicationId = await createApplication({
        authUserId: testData.testUserId,
        jobId: testData.jobBId,
      })

      trackCreatedApplication(applicationId)

      // Kintoneから確認
      const record = await getApplicationFromKintone(applicationId)
      expect(record?.status).toBe("応募済み")
    }, 30000)
  })

  describe("2. 重複応募チェック", () => {
    test("同じ案件に2回応募しようとすると重複が検出される", async () => {
      // 既に案件Aには応募済み（前のテストで）
      const isDuplicate = await checkDuplicateApplication(
        testData.testUserId,
        testData.jobAId
      )

      expect(isDuplicate).toBe(true)
    }, 30000)

    test("未応募の案件は重複なしと判定される", async () => {
      // 存在しない案件ID
      const isDuplicate = await checkDuplicateApplication(
        testData.testUserId,
        "99999999"
      )

      expect(isDuplicate).toBe(false)
    }, 30000)
  })

  describe("3. 応募履歴の取得", () => {
    test("応募したレコードがauth_user_idで検索できる", async () => {
      const applications = await findApplicationsByAuthUserId(testData.testUserId)

      // 2件の応募（案件Aと案件B）
      expect(applications.length).toBeGreaterThanOrEqual(2)

      // テストユーザーの応募のみ
      for (const app of applications) {
        expect(app.authUserId).toBe(testData.testUserId)
      }
    }, 30000)
  })
})
