/**
 * 統合テスト用クリーンアップ
 * テスト後のKintoneレコード削除
 */

import {
  createTalentClient,
  createJobClient,
  createApplicationClient,
  getAppIds,
} from "@/lib/kintone/client"
import { TALENT_FIELDS, JOB_FIELDS, APPLICATION_FIELDS } from "@/lib/kintone/fieldMapping"
import { TEST_PREFIX } from "./kintone-setup"
import { getCreatedRecords } from "./seed-data"

/**
 * 追跡されたレコードを削除
 */
export const cleanupTrackedRecords = async (): Promise<void> => {
  const records = getCreatedRecords()

  // 応募レコードを削除
  if (records.applications.length > 0) {
    const client = createApplicationClient()
    const ids = records.applications.map((r) => r.id)
    try {
      await client.record.deleteRecords({
        app: records.applications[0].appId,
        ids,
      })
      console.log(`🗑️ 応募レコード ${ids.length} 件を削除`)
    } catch (error) {
      console.error("応募レコードの削除に失敗:", error)
    }
    records.applications.length = 0 // 配列をクリア
  }

  // 案件レコードを削除
  if (records.jobs.length > 0) {
    const client = createJobClient()
    const ids = records.jobs.map((r) => r.id)
    try {
      await client.record.deleteRecords({
        app: records.jobs[0].appId,
        ids,
      })
      console.log(`🗑️ 案件レコード ${ids.length} 件を削除`)
    } catch (error) {
      console.error("案件レコードの削除に失敗:", error)
    }
    records.jobs.length = 0
  }

  // 人材レコードを削除
  if (records.talents.length > 0) {
    const client = createTalentClient()
    const ids = records.talents.map((r) => r.id)
    try {
      await client.record.deleteRecords({
        app: records.talents[0].appId,
        ids,
      })
      console.log(`🗑️ 人材レコード ${ids.length} 件を削除`)
    } catch (error) {
      console.error("人材レコードの削除に失敗:", error)
    }
    records.talents.length = 0
  }
}

/**
 * テストプレフィックスを持つ全レコードを削除（フルクリーンアップ）
 * ⚠️ 注意: 開発環境でのみ使用してください
 */
export const cleanupAllTestRecords = async (): Promise<void> => {
  console.log(`🧹 ${TEST_PREFIX}* のレコードを全削除開始...`)

  // 応募レコードを削除
  try {
    const appClient = createApplicationClient()
    const appId = getAppIds().application
    const appRecords = await appClient.record.getRecords({
      app: appId,
      query: `${APPLICATION_FIELDS.AUTH_USER_ID} like "${TEST_PREFIX}%" limit 500`,
      fields: ["$id"],
    })

    if (appRecords.records.length > 0) {
      const ids = appRecords.records.map((r) => r.$id.value as string)
      await appClient.record.deleteRecords({ app: appId, ids })
      console.log(`🗑️ 応募レコード ${ids.length} 件を削除`)
    }
  } catch (error) {
    console.error("応募レコードのクリーンアップに失敗:", error)
  }

  // 案件レコードを削除
  try {
    const jobClient = createJobClient()
    const jobAppId = getAppIds().job
    const jobRecords = await jobClient.record.getRecords({
      app: jobAppId,
      query: `${JOB_FIELDS.TITLE} like "${TEST_PREFIX}%" limit 500`,
      fields: ["$id"],
    })

    if (jobRecords.records.length > 0) {
      const ids = jobRecords.records.map((r) => r.$id.value as string)
      await jobClient.record.deleteRecords({ app: jobAppId, ids })
      console.log(`🗑️ 案件レコード ${ids.length} 件を削除`)
    }
  } catch (error) {
    console.error("案件レコードのクリーンアップに失敗:", error)
  }

  // 人材レコードを削除
  try {
    const talentClient = createTalentClient()
    const talentAppId = getAppIds().talent
    const talentRecords = await talentClient.record.getRecords({
      app: talentAppId,
      query: `${TALENT_FIELDS.AUTH_USER_ID} like "${TEST_PREFIX}%" limit 500`,
      fields: ["$id"],
    })

    if (talentRecords.records.length > 0) {
      const ids = talentRecords.records.map((r) => r.$id.value as string)
      await talentClient.record.deleteRecords({ app: talentAppId, ids })
      console.log(`🗑️ 人材レコード ${ids.length} 件を削除`)
    }
  } catch (error) {
    console.error("人材レコードのクリーンアップに失敗:", error)
  }

  console.log("✅ クリーンアップ完了")
}
