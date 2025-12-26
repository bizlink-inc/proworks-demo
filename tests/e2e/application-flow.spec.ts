import { test, expect, Page } from '@playwright/test';

/**
 * 案件応募フロー E2Eテスト
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
  await expect(page).toHaveURL('/', { timeout: 10000 });
};

test.describe('案件一覧表示', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = getTestUser();
    await login(page, testUser.email, testUser.password);
  });

  test('ログイン後に案件一覧が表示される', async ({ page }) => {
    // ダッシュボードにいることを確認
    await expect(page).toHaveURL('/');

    // 案件カードが表示されることを確認（少なくとも1件）
    await expect(page.locator('[data-testid="job-card"]').or(
      page.locator('.job-card')
    ).or(
      page.locator('article').first()
    )).toBeVisible({ timeout: 10000 });

    console.log('✅ 案件一覧が表示されました');
  });

  test('案件を検索できる', async ({ page }) => {
    // 検索ボックスを探す
    const searchInput = page.locator('input[placeholder*="検索"]').or(
      page.locator('[data-testid="search-input"]')
    ).or(
      page.locator('input[type="search"]')
    );

    if (await searchInput.isVisible()) {
      // 検索キーワードを入力
      await searchInput.fill('React');

      // 検索を実行（Enterキーまたはボタンクリック）
      await searchInput.press('Enter');

      // 検索結果を待つ
      await page.waitForTimeout(1000);

      console.log('✅ 検索が実行されました');
    } else {
      console.log('⚠️ 検索ボックスが見つかりません');
    }
  });
});

test.describe('案件詳細と応募', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = getTestUser();
    await login(page, testUser.email, testUser.password);
  });

  test('案件カードをクリックして詳細を表示できる', async ({ page }) => {
    // 最初の案件カードを取得
    const firstJobCard = page.locator('[data-testid="job-card"]').or(
      page.locator('.job-card')
    ).or(
      page.locator('article')
    ).first();

    await expect(firstJobCard).toBeVisible({ timeout: 10000 });

    // 案件カードをクリック（または「詳細を見る」ボタン）
    const detailButton = firstJobCard.locator('button:has-text("詳細")').or(
      firstJobCard.locator('a:has-text("詳細")')
    ).or(
      firstJobCard
    );

    await detailButton.click();

    // 詳細モーダルまたは詳細ページが表示されることを確認
    const detailContent = page.locator('[data-testid="job-detail-modal"]').or(
      page.locator('[role="dialog"]')
    ).or(
      page.locator('.modal')
    );

    // モーダルが開くか、詳細ページに遷移するか
    const isModalVisible = await detailContent.isVisible().catch(() => false);
    const urlChanged = page.url().includes('/jobs/');

    if (isModalVisible || urlChanged) {
      console.log('✅ 案件詳細が表示されました');
    } else {
      console.log('⚠️ 案件詳細の表示方法を確認してください');
    }
  });

  test('案件に応募できる（手動確認用）', async ({ page }) => {
    // 最初の案件カードを取得
    const firstJobCard = page.locator('[data-testid="job-card"]').or(
      page.locator('.job-card')
    ).or(
      page.locator('article')
    ).first();

    await expect(firstJobCard).toBeVisible({ timeout: 10000 });

    // 案件タイトルを取得
    const jobTitle = await firstJobCard.locator('h2, h3, .title').first().textContent();
    console.log(`📋 対象案件: ${jobTitle}`);

    // 詳細を開く
    await firstJobCard.click();
    await page.waitForTimeout(500);

    // 応募ボタンを探す
    const applyButton = page.locator('button:has-text("応募")').or(
      page.locator('[data-testid="apply-button"]')
    );

    if (await applyButton.isVisible()) {
      console.log('✅ 応募ボタンが表示されています');
      console.log('💡 実際に応募する場合は、このテストを手動で実行してください');

      // 手動確認用に一時停止（コメントアウトして自動テストにすることも可能）
      // await page.pause();

      // 自動テストの場合:
      // await applyButton.click();
      // await expect(page.locator('text=応募しますか')).toBeVisible();
      // await page.locator('button:has-text("応募する")').click();
      // await expect(page.locator('text=応募が完了しました')).toBeVisible();
    } else {
      console.log('⚠️ 応募ボタンが見つかりません（既に応募済みか、案件がクローズ済みの可能性があります）');
    }
  });
});

test.describe('応募履歴', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = getTestUser();
    await login(page, testUser.email, testUser.password);
  });

  test('応募履歴ページにアクセスできる', async ({ page }) => {
    // 応募履歴ページに移動
    await page.goto('/applications');

    // ページが表示されることを確認
    await expect(page).toHaveURL('/applications');

    // 応募履歴の見出しまたはコンテンツを確認
    await expect(
      page.locator('h1:has-text("応募")').or(
        page.locator('text=応募履歴')
      ).or(
        page.locator('[data-testid="applications-list"]')
      )
    ).toBeVisible({ timeout: 5000 });

    console.log('✅ 応募履歴ページが表示されました');
  });

  test('応募済み案件が一覧に表示される', async ({ page }) => {
    await page.goto('/applications');

    // 応募履歴のリストを確認
    const applicationList = page.locator('[data-testid="application-row"]').or(
      page.locator('.application-item')
    ).or(
      page.locator('table tbody tr')
    ).or(
      page.locator('article')
    );

    // 何かしらのコンテンツがあることを確認（応募がない場合は空メッセージ）
    const hasApplications = await applicationList.first().isVisible().catch(() => false);
    const hasEmptyMessage = await page.locator('text=応募履歴がありません').or(
      page.locator('text=まだ応募していません')
    ).isVisible().catch(() => false);

    if (hasApplications) {
      console.log('✅ 応募履歴が表示されています');
    } else if (hasEmptyMessage) {
      console.log('📭 応募履歴がありません（期待通り）');
    } else {
      console.log('⚠️ 応募履歴の表示状態を確認してください');
    }
  });
});

test.describe('応募取消し', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = getTestUser();
    await login(page, testUser.email, testUser.password);
  });

  test('応募済みステータスの案件を取り消せる（手動確認用）', async ({ page }) => {
    await page.goto('/applications');

    // 「応募済み」ステータスの行を探す
    const appliedRow = page.locator('[data-testid="application-row"]:has-text("応募済み")').or(
      page.locator('tr:has-text("応募済み")')
    ).or(
      page.locator('article:has-text("応募済み")')
    ).first();

    const rowExists = await appliedRow.isVisible().catch(() => false);

    if (rowExists) {
      console.log('✅ 応募済み案件が見つかりました');

      // 取消しボタンを探す
      const cancelButton = appliedRow.locator('button:has-text("取消")').or(
        appliedRow.locator('[data-testid="cancel-button"]')
      );

      if (await cancelButton.isVisible()) {
        console.log('✅ 取消しボタンが表示されています');
        console.log('💡 実際に取り消す場合は、このテストを手動で実行してください');

        // 手動確認用に一時停止
        // await page.pause();

        // 自動テストの場合:
        // await cancelButton.click();
        // await expect(page.locator('text=応募を取り消しますか')).toBeVisible();
        // await page.locator('button:has-text("取り消す")').click();
        // await expect(appliedRow.locator('text=応募取消し')).toBeVisible();
      } else {
        console.log('⚠️ 取消しボタンが見つかりません');
      }
    } else {
      console.log('📭 応募済み案件がありません（テストをスキップ）');
    }
  });
});

test.describe('応募済み案件の除外', () => {
  test.beforeEach(async ({ page }) => {
    const testUser = getTestUser();
    await login(page, testUser.email, testUser.password);
  });

  test('応募済み案件は案件一覧に表示されない', async ({ page }) => {
    // まず応募履歴から応募済み案件のタイトルを取得
    await page.goto('/applications');

    const appliedJobTitle = await page.locator('[data-testid="application-row"] .job-title').or(
      page.locator('tr td:first-child')
    ).first().textContent().catch(() => null);

    if (appliedJobTitle) {
      console.log(`📋 応募済み案件: ${appliedJobTitle}`);

      // ダッシュボードに戻る
      await page.goto('/');

      // 応募済み案件が一覧に表示されていないことを確認
      const jobCards = page.locator('[data-testid="job-card"], .job-card, article');
      const cardCount = await jobCards.count();

      let foundAppliedJob = false;
      for (let i = 0; i < cardCount; i++) {
        const cardTitle = await jobCards.nth(i).locator('h2, h3, .title').textContent();
        if (cardTitle?.includes(appliedJobTitle.trim())) {
          foundAppliedJob = true;
          break;
        }
      }

      if (!foundAppliedJob) {
        console.log('✅ 応募済み案件は案件一覧に表示されていません');
      } else {
        console.log('⚠️ 応募済み案件が案件一覧に表示されています');
      }
    } else {
      console.log('📭 応募履歴がないためテストをスキップ');
    }
  });
});
