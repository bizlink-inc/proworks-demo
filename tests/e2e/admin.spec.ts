import { test, expect } from "@playwright/test"

test.describe("管理者画面", () => {
  test.describe("8.1 管理者ログインページ", () => {
    test("管理者ログインページが表示される", async ({ page }) => {
      await page.goto("/admin/login")

      // ログインフォームが表示される
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test("空のフォームで送信するとエラーが表示される", async ({ page }) => {
      await page.goto("/admin/login")

      await page.click('button[type="submit"]')

      // バリデーションエラーが表示される
      const emailInput = page.locator('input[type="email"], input[name="email"]')
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBe(true)
    })
  })

  test.describe("8.2 管理者ダッシュボード", () => {
    test("未認証時は管理者ダッシュボードにアクセスできない", async ({ page }) => {
      await page.goto("/admin")

      // ログインページにリダイレクト
      await expect(page).toHaveURL(/admin\/login|login/)
    })

    test("バッチ設定ページは未認証時アクセス不可", async ({ page }) => {
      await page.goto("/admin/batch-settings")

      // ログインページにリダイレクト
      await expect(page).toHaveURL(/admin\/login|login/)
    })
  })
})
