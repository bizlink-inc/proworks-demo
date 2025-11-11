/**
 * サインアップのテストスクリプト
 * 
 * 使用方法:
 *   npm run test-signup
 *   npm run test-signup <email>
 */

const testSignup = async (email?: string) => {
  const testEmail = email || `test${Date.now()}@example.com`;
  const testData = {
    email: testEmail,
    password: "test1234",
    name: "テスト ユーザー",
    lastName: "テスト",
    firstName: "ユーザー",
    phone: "090-1234-5678",
    birthDate: "1990-01-01",
  };

  console.log("\n🧪 サインアップテストを開始します\n");
  console.log("📧 テストデータ:");
  console.log(`   メール: ${testData.email}`);
  console.log(`   パスワード: ${testData.password}`);
  console.log(`   氏名: ${testData.lastName} ${testData.firstName}`);
  console.log(`   電話: ${testData.phone}`);
  console.log(`   生年月日: ${testData.birthDate}\n`);

  try {
    // 1. Better Authでユーザー登録
    console.log("⏳ Step 1: Better Authでユーザー登録中...");
    const authResponse = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testData.email,
        password: testData.password,
        name: testData.name,
      }),
    });

    if (!authResponse.ok) {
      const error = await authResponse.json();
      console.error("❌ Better Auth登録失敗:", error);
      
      if (authResponse.status === 400 || error.message?.includes("email")) {
        console.log("\n💡 このメールアドレスは既に登録されています。");
        console.log("   削除してから再実行してください:");
        console.log(`   npm run delete-user ${testData.email}\n`);
      }
      process.exit(1);
    }

    const authData = await authResponse.json();
    console.log("✅ Better Auth登録成功");
    console.log(`   ユーザーID: ${authData.user.id}\n`);

    // 2. kintoneに人材情報を登録
    console.log("⏳ Step 2: kintoneに人材情報を登録中...");
    const kintoneResponse = await fetch("http://localhost:3000/api/talents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authUserId: authData.user.id,
        lastName: testData.lastName,
        firstName: testData.firstName,
        email: testData.email,
        phone: testData.phone,
        birthDate: testData.birthDate,
      }),
    });

    if (!kintoneResponse.ok) {
      const error = await kintoneResponse.json();
      console.error("❌ kintone登録失敗:", error);
      console.log("\n⚠️  Better Authには登録されましたが、kintoneへの登録に失敗しました。");
      console.log("   手動で削除してください:");
      console.log(`   npm run delete-user ${testData.email}\n`);
      process.exit(1);
    }

    const kintoneData = await kintoneResponse.json();
    console.log("✅ kintone登録成功");
    console.log(`   レコードID: ${kintoneData.id}\n`);

    // 成功メッセージ
    console.log("🎉 サインアップテスト完了！\n");
    console.log("📝 ログイン情報:");
    console.log(`   メールアドレス: ${testData.email}`);
    console.log(`   パスワード: ${testData.password}\n`);
    console.log("🌐 ログインURL:");
    console.log("   http://localhost:3000/auth/signin\n");
    console.log("🗑️  削除コマンド:");
    console.log(`   npm run delete-user ${testData.email}\n`);

  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);
    process.exit(1);
  }
};

// コマンドライン引数からメールアドレスを取得
const email = process.argv[2];

testSignup(email);

