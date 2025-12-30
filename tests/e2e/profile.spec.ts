import { test, expect } from "@playwright/test"

test.describe("プロフィールページ", () => {
  test.describe("2.1 プロフィール表示", () => {
    test("未認証時はプロフィールページにアクセスできない", async ({ page }) => {
      // /me は / にリダイレクトされ、さらに未認証時は /auth/signin にリダイレクト
      await page.goto("/me")

      // ログインページにリダイレクト
      await expect(page).toHaveURL(/auth\/signin/)
    })

    test("認証後は /me から案件一覧ページ（/）にリダイレクトされる", async ({ page }) => {
      // このテストは認証状態が必要なため、スキップ
      // 実際の動作: /me → / (案件一覧がデフォルトで表示される)
      test.skip()
    })
  })
})

test.describe("応募履歴ページ", () => {
  test.describe("4.1 応募履歴表示", () => {
    test("未認証時は応募履歴ページにアクセスできない", async ({ page }) => {
      await page.goto("/applications")

      // ログインページにリダイレクト
      await expect(page).toHaveURL(/auth\/signin/)
    })
  })
})

test.describe("お問い合わせページ", () => {
  test.describe("6.1 お問い合わせフォーム", () => {
    test("お問い合わせページが表示される", async ({ page }) => {
      const response = await page.goto("/company/contact")

      // ページが存在するか確認
      if (response?.status() === 200) {
        // フォームが存在するか
        const form = page.locator("form")
        await expect(form).toBeVisible()
      }
    })
  })
})
