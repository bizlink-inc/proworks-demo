/**
 * 統合テスト用 Kintone セットアップ
 * 実際のKintone開発環境に接続してテストを実行するための設定
 */

import { config } from "dotenv"

// .env.local を読み込む
config({ path: ".env.local" })

// テストデータ識別用プレフィックス
export const TEST_PREFIX = "integration-test-"

// テスト用ユーザーID
export const TEST_USER_ID = `${TEST_PREFIX}user-${Date.now()}`

// テスト用案件ID（Kintoneで実際に使われるレコードID）
export const TEST_JOB_IDS = {
  JOB_A: "", // 動的に設定
  JOB_B: "", // 動的に設定
}

/**
 * Kintone環境変数が正しく設定されているか確認
 */
export const verifyKintoneConfig = (): void => {
  const requiredEnvVars = [
    "KINTONE_BASE_URL",
    "KINTONE_TALENT_API_TOKEN",
    "KINTONE_JOB_API_TOKEN",
    "KINTONE_APPLICATION_API_TOKEN",
    "KINTONE_TALENT_APP_ID",
    "KINTONE_JOB_APP_ID",
    "KINTONE_APPLICATION_APP_ID",
  ]

  const missing = requiredEnvVars.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `統合テストに必要な環境変数が設定されていません: ${missing.join(", ")}\n` +
        `.env.local に設定してください。`
    )
  }

  console.log("✅ Kintone環境変数の確認完了")
  console.log(`   Base URL: ${process.env.KINTONE_BASE_URL}`)
  console.log(`   Talent App ID: ${process.env.KINTONE_TALENT_APP_ID}`)
  console.log(`   Job App ID: ${process.env.KINTONE_JOB_APP_ID}`)
  console.log(`   Application App ID: ${process.env.KINTONE_APPLICATION_APP_ID}`)
}

/**
 * モック無効化の確認
 */
export const verifyMocksDisabled = (): void => {
  const mockValue = process.env.MOCK_EXTERNAL_SERVICES
  if (mockValue !== "false") {
    throw new Error(
      `統合テストではモックを無効化する必要があります。\n` +
        `現在の値: MOCK_EXTERNAL_SERVICES=${mockValue}\n` +
        `MOCK_EXTERNAL_SERVICES=false で実行してください。`
    )
  }
  console.log("✅ モック無効化確認完了 (MOCK_EXTERNAL_SERVICES=false)")
}
