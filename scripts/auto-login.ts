import { chromium } from 'playwright';

const autoLogin = async () => {
  const email = process.argv[2] || 'test@example.com';
  const password = process.argv[3] || 'test1234';

  console.log('🚀 自動ログインを開始します...');
  console.log(`Email: ${email}`);

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // 動作を見やすくするため少し遅くする
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // サインインページに移動
    await page.goto('http://localhost:3000/auth/signin');
    console.log('✓ サインインページを開きました');

    // メールアドレスを入力
    await page.fill('input[type="email"]', email);
    console.log('✓ メールアドレスを入力しました');

    // パスワードを入力
    await page.fill('input[type="password"]', password);
    console.log('✓ パスワードを入力しました');

    // ログインボタンをクリック
    await page.click('button[type="submit"]');
    console.log('✓ ログインボタンをクリックしました');

    // ダッシュボードへのリダイレクトを待つ
    await page.waitForURL('http://localhost:3000/', { timeout: 5000 });
    console.log('✅ ログイン成功！ダッシュボードに移動しました');

    // ブラウザを閉じずに保持（手動で操作できるように）
    console.log('\n🎉 ブラウザを開いたままにします。手動で操作してください。');
    console.log('終了するには Ctrl+C を押してください。');

    // プロセスを維持
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    await browser.close();
    process.exit(1);
  }
};

autoLogin();

