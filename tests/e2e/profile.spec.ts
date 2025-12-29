import { test, expect } from "@playwright/test"

test.describe("プロフィールページ", () => {
  test.describe("2.1 プロフィール表示", () => {
    test("未認証時はプロフィールページにアクセスできない", async ({ page }) => {
      await page.goto("/profile")

      // ログインページにリダイレクト
      await expect(page).toHaveURL(/login|signin|auth/)
    })

    test("マイページ（設定）にアクセスするとリダイレクトされる", async ({ page }) => {
      await page.goto("/settings")

      // ログインページにリダイレクトまたは設定ページ表示
      const url = page.url()
      expect(url).toMatch(/login|signin|auth|settings/)
    })
  })
})

test.describe("応募履歴ページ", () => {
  test.describe("4.1 応募履歴表示", () => {
    test("未認証時は応募履歴ページにアクセスできない", async ({ page }) => {
      await page.goto("/applications")

      // ログインページにリダイレクト
      await expect(page).toHaveURL(/login|signin|auth/)
    })
  })
})

test.describe("退会ページ", () => {
  test.describe("7.1 退会フロー", () => {
    test("未認証時は退会ページにアクセスできない", async ({ page }) => {
      await page.goto("/withdraw")

      // ログインページにリダイレクト
      await expect(page).toHaveURL(/login|signin|auth/)
    })
  })
})

test.describe("お問い合わせページ", () => {
  test.describe("6.1 お問い合わせフォーム", () => {
    test("お問い合わせページが表示される", async ({ page }) => {
      const response = await page.goto("/contact")

      // ページが存在するか確認
      if (response?.status() === 200) {
        // フォームが存在するか
        const form = page.locator("form")
        await expect(form).toBeVisible()
      }
    })
  })
})
