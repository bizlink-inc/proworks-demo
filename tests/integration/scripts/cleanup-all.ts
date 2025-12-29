/**
 * 統合テスト用クリーンアップスクリプト
 * テストプレフィックスを持つ全レコードを削除
 *
 * 使用方法:
 *   npm run test:integration:cleanup
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { cleanupAllTestRecords } from "../helpers/cleanup"
import { verifyKintoneConfig } from "../helpers/kintone-setup"

async function main() {
  console.log("=".repeat(50))
  console.log("統合テスト用レコード クリーンアップ")
  console.log("=".repeat(50))
  console.log("")

  try {
    verifyKintoneConfig()
    await cleanupAllTestRecords()
  } catch (error) {
    console.error("❌ クリーンアップに失敗しました:", error)
    process.exit(1)
  }
}

main()
