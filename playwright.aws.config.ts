import { defineConfig, devices } from "@playwright/test"

/**
 * AWS環境用Playwright設定
 * 環境変数 TEST_ENV で対象環境を切り替え
 * - dev: AWS App Runner Dev環境
 * - prod: AWS App Runner Prod環境（将来用）
 */

const envUrls: Record<string, string> = {
  dev: "https://shqzybdxje.ap-northeast-1.awsapprunner.com",
  prod: process.env.AWS_PROD_URL || "https://your-production-url.awsapprunner.com",
}

const testEnv = process.env.TEST_ENV || "dev"
const baseURL = envUrls[testEnv]

if (!baseURL) {
  throw new Error(`Unknown TEST_ENV: ${testEnv}. Use 'dev' or 'prod'.`)
}

console.log(`\n🎯 Testing against: ${testEnv.toUpperCase()} (${baseURL})\n`)

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2, // AWS環境はネットワーク遅延があるためリトライ増加
  workers: 2, // 並列数を制限してレート制限回避
  timeout: 60000, // タイムアウトを60秒に延長
  reporter: [
    ["html", { outputFolder: "playwright-report-aws" }],
    ["list"],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // AWS環境用の追加設定
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // AWS環境テストではローカルサーバーを起動しない
  // webServer は設定しない
})
