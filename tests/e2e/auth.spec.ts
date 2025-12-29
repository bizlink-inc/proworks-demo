import { test, expect } from "@playwright/test"

test.describe("認証フロー", () => {
  test.describe("1.1 ログインページ", () => {
    test("ログインページが表示される", async ({ page }) => {
      await page.goto("/login")

      await expect(page.locator("h1, h2").first()).toBeVisible()
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test("メールアドレスとパスワードが入力できる", async ({ page }) => {
      await page.goto("/login")

      await page.fill('input[type="email"], input[name="email"]', "test@example.com")
      await page.fill('input[type="password"]', "password123")

      await expect(page.locator('input[type="email"], input[name="email"]')).toHaveValue("test@example.com")
      await expect(page.locator('input[type="password"]')).toHaveValue("password123")
    })

    test("空のフォームで送信するとエラーが表示される", async ({ page }) => {
      await page.goto("/login")

      await page.click('button[type="submit"]')

      // バリデーションエラーまたはHTML5バリデーションが表示される
      const emailInput = page.locator('input[type="email"], input[name="email"]')
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBe(true)
    })
  })

  test.describe("1.2 新規登録ページ", () => {
    test("新規登録ページが表示される", async ({ page }) => {
      await page.goto("/signup")

      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
    })

    test("ログインページへのリンクがある", async ({ page }) => {
      await page.goto("/signup")

      const loginLink = page.locator('a[href*="login"]')
      await expect(loginLink).toBeVisible()
    })
  })

  test.describe("1.3 パスワードリセットページ", () => {
    test("パスワードリセットページが表示される", async ({ page }) => {
      await page.goto("/forgot-password")

      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })
  })

  test.describe("1.4 未認証時のリダイレクト", () => {
    test("ダッシュボードにアクセスするとログインページにリダイレクトされる", async ({ page }) => {
      await page.goto("/dashboard")

      // ログインページにリダイレクトされるか、ログインを促すUIが表示される
      await expect(page).toHaveURL(/login|signin|auth/)
    })

    test("マイページにアクセスするとログインページにリダイレクトされる", async ({ page }) => {
      await page.goto("/profile")

      await expect(page).toHaveURL(/login|signin|auth/)
    })
  })
})
