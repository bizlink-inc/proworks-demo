/**
 * プロフィール更新統合テスト
 * 実際のKintone開発環境に接続してプロフィール更新機能をテスト
 */

import { describe, test, expect, beforeAll, afterAll } from "vitest"
import {
  verifyKintoneConfig,
  verifyMocksDisabled,
  TEST_PREFIX,
} from "../helpers/kintone-setup"
import {
  createTestTalent,
  getTalentFromKintone,
} from "../helpers/seed-data"
import { cleanupTrackedRecords } from "../helpers/cleanup"
import {
  getTalentByAuthUserId,
  updateTalent,
} from "@/lib/kintone/services/talent"

// テストデータ
let testUserId: string
let talentRecordId: string

describe("プロフィール更新統合テスト", () => {
  beforeAll(async () => {
    // 環境チェック
    verifyKintoneConfig()
    verifyMocksDisabled()

    // テストユーザー作成
    console.log("\n📦 テスト用人材レコードを作成中...")
    const timestamp = Date.now()
    testUserId = `${TEST_PREFIX}profile-${timestamp}`

    talentRecordId = await createTestTalent({
      authUserId: testUserId,
      lastName: "更新前",
      firstName: "太郎",
      email: `${TEST_PREFIX}profile-${timestamp}@example.com`,
      phone: "090-1111-1111",
      birthDate: "1985-05-15",
    })

    console.log(`   テストユーザーID: ${testUserId}`)
    console.log(`   レコードID: ${talentRecordId}`)
    console.log("")
  }, 60000)

  afterAll(async () => {
    // クリーンアップ
    console.log("\n🧹 テストデータをクリーンアップ中...")
    await cleanupTrackedRecords()
  }, 60000)

  describe("1. プロフィール取得", () => {
    test("auth_user_idでプロフィールを取得できる", async () => {
      const talent = await getTalentByAuthUserId(testUserId)

      expect(talent).not.toBeNull()
      expect(talent?.authUserId).toBe(testUserId)
      expect(talent?.lastName).toBe("更新前")
      expect(talent?.firstName).toBe("太郎")
    }, 30000)

    test("存在しないauth_user_idではnullが返る", async () => {
      const talent = await getTalentByAuthUserId("non-existent-user-id")

      expect(talent).toBeNull()
    }, 30000)
  })

  describe("2. プロフィール更新", () => {
    test("姓名を更新するとKintoneのレコードが更新される", async () => {
      // 1. 更新を実行
      await updateTalent(talentRecordId, {
        lastName: "更新後",
        firstName: "次郎",
        fullName: "更新後 次郎",
      })

      // 2. Kintoneから直接取得して確認
      const record = await getTalentFromKintone(testUserId)

      expect(record).not.toBeNull()
      expect(record?.lastName).toBe("更新後")
      expect(record?.firstName).toBe("次郎")
    }, 30000)

    test("スキルを更新するとKintoneのレコードが更新される", async () => {
      // 1. スキルを更新
      await updateTalent(talentRecordId, {
        skills: "TypeScript, React, Node.js, PostgreSQL",
      })

      // 2. 確認
      const record = await getTalentFromKintone(testUserId)
      expect(record?.skills).toContain("TypeScript")
      expect(record?.skills).toContain("React")
    }, 30000)

    test("部分更新が正しく動作する（他のフィールドは変更されない）", async () => {
      // 更新前の状態を取得
      const before = await getTalentFromKintone(testUserId)

      // 電話番号のみ更新
      await updateTalent(talentRecordId, {
        phone: "090-9999-9999",
      })

      // 確認
      const after = await getTalentFromKintone(testUserId)

      // 更新したフィールドは変更されている
      expect(after?.phone).toBe("090-9999-9999")

      // 更新していないフィールドは変更されていない
      expect(after?.lastName).toBe(before?.lastName)
      expect(after?.firstName).toBe(before?.firstName)
      expect(after?.email).toBe(before?.email)
    }, 30000)
  })

  describe("3. サービス関数経由の取得", () => {
    test("更新後のデータがサービス関数経由で正しく取得できる", async () => {
      // getTalentByAuthUserId（サービス関数）で取得
      const talent = await getTalentByAuthUserId(testUserId)

      expect(talent).not.toBeNull()
      // 前のテストで更新した値が反映されている
      expect(talent?.lastName).toBe("更新後")
      expect(talent?.phone).toBe("090-9999-9999")
    }, 30000)
  })
})
