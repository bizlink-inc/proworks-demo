import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// テストデータ
const testUser = {
  lastName: 'テスト',
  firstName: '太郎',
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  phone: '09012345678',
  birthYear: '1990',
  birthMonth: '5',
  birthDay: '15',
  lastNameKana: 'テスト',
  firstNameKana: 'タロウ',
};

// 認証リンクを取得するヘルパー関数
const waitForVerificationLink = async (timeout = 30000): Promise<string> => {
  const testDataPath = path.join(process.cwd(), '.e2e-test-data', 'last-email.json');
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      if (fs.existsSync(testDataPath)) {
        const data = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
        // 最新のデータかどうか確認（5秒以内に生成されたもの）
        if (data.timestamp && Date.now() - data.timestamp < 60000) {
          // ファイルを削除して次回のテストに備える
          fs.unlinkSync(testDataPath);
          return data.url;
        }
      }
    } catch (error) {
      // ファイルがまだ存在しないかパースエラー
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error('認証リンクの取得がタイムアウトしました');
};

// テスト前にデータファイルをクリア
test.beforeEach(async () => {
  const testDataPath = path.join(process.cwd(), '.e2e-test-data', 'last-email.json');
  try {
    if (fs.existsSync(testDataPath)) {
      fs.unlinkSync(testDataPath);
    }
  } catch (error) {
    // 無視
  }
});

test.describe('新規登録フロー', () => {
  test('新規登録 → メール認証 → プロフィール完成 → マイページ（ブラウザ開いたままにする）', async ({ page, context }) => {
    // ステップ1: 新規登録ページにアクセス
    console.log('📝 ステップ1: 新規登録ページにアクセス');
    await page.goto('/auth/signup');
    await expect(page).toHaveTitle(/PRO WORKS/i);

    // ステップ2: フォームに入力
    console.log('📝 ステップ2: フォームに入力');
    
    // 姓名
    const lastNameInput = page.locator('input[placeholder="山田"]').first();
    const firstNameInput = page.locator('input[placeholder="太郎"]').first();
    await lastNameInput.fill(testUser.lastName);
    await firstNameInput.fill(testUser.firstName);

    // メールアドレス
    await page.locator('input[type="email"]').fill(testUser.email);

    // パスワード
    await page.locator('input[type="password"]').fill(testUser.password);

    // 電話番号
    await page.locator('input[type="tel"]').fill(testUser.phone);

    // 生年月日
    await page.locator('#birth-year').selectOption(testUser.birthYear);
    await page.locator('#birth-month').selectOption(testUser.birthMonth);
    await page.locator('#birth-day').selectOption(testUser.birthDay);

    // 利用規約に同意
    await page.locator('#terms-agreed').check();

    // ステップ3: 登録ボタンをクリック
    console.log('📝 ステップ3: 登録ボタンをクリック');
    await page.locator('button[type="submit"]').click();

    // メール送信完了画面を待つ
    await expect(page.locator('text=メールを送信しました')).toBeVisible({ timeout: 10000 });
    console.log('✅ メール送信完了画面が表示されました');

    // ステップ4: 認証リンクを取得して遷移
    console.log('📝 ステップ4: 認証リンクを取得中...');
    const verificationUrl = await waitForVerificationLink();
    console.log(`✅ 認証リンクを取得: ${verificationUrl.substring(0, 50)}...`);

    // 認証リンクにアクセス
    await page.goto(verificationUrl);

    // ステップ5: プロフィール完成ページ
    console.log('📝 ステップ5: プロフィール完成ページ');
    await expect(page.locator('text=メール認証が完了しました')).toBeVisible({ timeout: 10000 });
    console.log('✅ プロフィール完成ページが表示されました');

    // フリガナを入力
    await page.locator('#lastNameKana').fill(testUser.lastNameKana);
    await page.locator('#firstNameKana').fill(testUser.firstNameKana);

    // 希望勤務スタイル（リモート）を選択
    await page.locator('#workstyle-リモート').check();

    // プロフィールを完成させるボタンをクリック
    await page.locator('button[type="submit"]').click();

    // ステップ6: マイページに遷移
    console.log('📝 ステップ6: マイページに遷移');
    await expect(page).toHaveURL('/me', { timeout: 10000 });
    console.log('✅ マイページに遷移しました');

    // マイページでプロフィール情報が表示されていることを確認
    await expect(page.getByRole('heading', { name: 'プロフィール' })).toBeVisible();
    console.log('✅ テスト完了！全フローが正常に動作しました！');
    console.log('💾 マイページでブラウザを開き続けています。');
    console.log(`   登録ユーザーのメール: ${testUser.email}`);
    console.log('   Playwright Inspectorで「Resume」ボタンを押すとテストが終了します。');
    
    // ブラウザを開いたまま待機（Playwright Inspectorが開く）
    await page.pause();
  });
});

