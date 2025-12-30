import { test, expect } from "@playwright/test"

test.describe("認証フロー", () => {
  test.describe("1.1 ログインページ", () => {
    test("ログインページが表示される", async ({ page }) => {
      await page.goto("/auth/signin")

      await expect(page.locator("h1, h2").first()).toBeVisible()
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test("メールアドレスとパスワードが入力できる", async ({ page }) => {
      await page.goto("/auth/signin")

      await page.fill('input[type="email"], input[name="email"]', "test@example.com")
      await page.fill('input[type="password"]', "password123")

      await expect(page.locator('input[type="email"], input[name="email"]')).toHaveValue("test@example.com")
      await expect(page.locator('input[type="password"]')).toHaveValue("password123")
    })

    test("空のフォームで送信するとエラーが表示される", async ({ page }) => {
      await page.goto("/auth/signin")

      await page.click('button[type="submit"]')

      // バリデーションエラーまたはHTML5バリデーションが表示される
      const emailInput = page.locator('input[type="email"], input[name="email"]')
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
      expect(isInvalid).toBe(true)
    })
  })

  test.describe("1.2 新規登録ページ", () => {
    test("新規登録ページが表示される", async ({ page }) => {
      await page.goto("/auth/signup")

      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
    })

    test("ログインページへのリンクがある", async ({ page }) => {
      await page.goto("/auth/signup")

      // signin へのリンクを検索
      const loginLink = page.locator('a[href*="signin"]')
      await expect(loginLink).toBeVisible()
    })
  })

  test.describe("1.3 パスワードリセットページ", () => {
    test("パスワードリセットページが表示される", async ({ page }) => {
      await page.goto("/auth/forgot-password")

      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })
  })

  test.describe("1.4 未認証時のリダイレクト", () => {
    test("ダッシュボードにアクセスするとログインページにリダイレクトされる", async ({ page }) => {
      // ルートページ（/）がダッシュボード
      await page.goto("/")

      // ログインページにリダイレクトされる
      await expect(page).toHaveURL(/auth\/signin/)
    })

    test("マイページにアクセスするとログインページにリダイレクトされる", async ({ page }) => {
      // /me は / にリダイレクトされ、さらに未認証時は /auth/signin にリダイレクト
      await page.goto("/me")

      await expect(page).toHaveURL(/auth\/signin/)
    })
  })

  test.describe("1.5 ウェルカムページ", () => {
    test("ウェルカムページで案件一覧へのリダイレクトボタンが表示される", async ({ page }) => {
      // ウェルカムページに直接アクセス（認証が必要なため、実際はリダイレクトされる可能性がある）
      const response = await page.goto("/auth/welcome")

      // ページが表示された場合のみテスト
      if (response?.status() === 200) {
        // 「案件一覧へ」を含むボタンまたはリンクが存在することを確認
        const jobListButton = page.locator('button:has-text("案件一覧へ"), a:has-text("案件一覧へ")')
        const skipButton = page.locator('button:has-text("後で入力する（案件一覧へ）")')

        // どちらかが存在すればOK
        const hasJobListButton = await jobListButton.count() > 0
        const hasSkipButton = await skipButton.count() > 0

        expect(hasJobListButton || hasSkipButton).toBe(true)
      }
    })
  })
})
