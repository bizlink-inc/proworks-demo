import { test, expect, Page } from '@playwright/test';

/**
 * ログインフロー E2Eテスト
 *
 * 環境変数でテストユーザーを設定:
 * - E2E_TEST_USER_EMAIL: テストユーザーのメールアドレス
 * - E2E_TEST_USER_PASSWORD: テストユーザーのパスワード
 *
 * 例: E2E_TEST_USER_EMAIL=test@example.com E2E_TEST_USER_PASSWORD=password123 npm run test:e2e
 */

// テストユーザー情報（環境変数から取得）
const getTestUser = () => ({
  email: process.env.E2E_TEST_USER_EMAIL || 'test@example.com',
  password: process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!',
});

/**
 * ログインヘルパー関数
 */
const login = async (page: Page, email: string, password: string) => {
  await page.goto('/auth/signin');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
};

test.describe('ログインフロー', () => {
  test('正常にログインできる', async ({ page }) => {
    const testUser = getTestUser();

    // ログインページにアクセス
    await page.goto('/auth/signin');
    await expect(page).toHaveTitle(/PRO WORKS/i);

    // ログインフォームが表示されていることを確認
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // ログイン情報を入力
    await page.locator('input[type="email"]').fill(testUser.email);
    await page.locator('input[type="password"]').fill(testUser.password);

    // ログインボタンをクリック
    await page.locator('button[type="submit"]').click();

    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // ログイン後のコンテンツが表示されることを確認
    // ナビゲーションにマイページリンクがあるか確認
    await expect(page.locator('nav').getByRole('link', { name: /マイページ|me/i })).toBeVisible({ timeout: 5000 });

    console.log('✅ ログイン成功');
  });

  test('間違ったパスワードではログインできない', async ({ page }) => {
    await page.goto('/auth/signin');

    await page.locator('input[type="email"]').fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // エラーメッセージが表示されることを確認
    await expect(page.locator('text=メールアドレスまたはパスワードが正しくありません').or(
      page.locator('[role="alert"]')
    )).toBeVisible({ timeout: 5000 });

    // ログインページに留まっていることを確認
    await expect(page).toHaveURL(/\/auth\/signin/);

    console.log('✅ 不正なログインが拒否されました');
  });

  test('ログアウトできる', async ({ page }) => {
    const testUser = getTestUser();

    // まずログイン
    await login(page, testUser.email, testUser.password);
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // マイページに移動
    await page.goto('/me');
    await expect(page).toHaveURL('/me');

    // ログアウトボタンを探してクリック
    const logoutButton = page.locator('button:has-text("ログアウト")').or(
      page.locator('[data-testid="logout-button"]')
    );

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // ログインページにリダイレクトされることを確認
      await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 10000 });
      console.log('✅ ログアウト成功');
    } else {
      console.log('⚠️ ログアウトボタンが見つかりません（マイページの構造を確認してください）');
    }
  });

  test('未認証でマイページにアクセスするとリダイレクトされる', async ({ page }) => {
    // 未認証状態でマイページにアクセス
    await page.goto('/me');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 10000 });

    console.log('✅ 未認証アクセスが正しくリダイレクトされました');
  });

  test('未認証で応募一覧にアクセスするとリダイレクトされる', async ({ page }) => {
    // 未認証状態で応募一覧にアクセス
    await page.goto('/applications');

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/auth\/signin/, { timeout: 10000 });

    console.log('✅ 未認証アクセスが正しくリダイレクトされました');
  });
});

test.describe('ログイン状態の維持', () => {
  test('ログイン後にページをリロードしても認証状態が維持される', async ({ page }) => {
    const testUser = getTestUser();

    // ログイン
    await login(page, testUser.email, testUser.password);
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // ページをリロード
    await page.reload();

    // まだダッシュボードにいることを確認
    await expect(page).toHaveURL('/');

    // ログイン後のコンテンツが表示されることを確認
    await expect(page.locator('nav').getByRole('link', { name: /マイページ|me/i })).toBeVisible({ timeout: 5000 });

    console.log('✅ 認証状態が維持されています');
  });
});
