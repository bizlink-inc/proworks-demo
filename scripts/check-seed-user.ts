/**
 * シードユーザー（seed_user_001）の状態を確認するスクリプト
 * RDS PostgreSQL上のuserテーブルとaccountテーブルの内容を確認
 */

import { config } from "dotenv";
// 環境変数を読み込む
config({ path: ".env.local" });
// .aws-resources.envが存在する場合は読み込む（オプション）
try {
  config({ path: ".aws-resources.env" });
} catch {
  // ファイルが存在しない場合は無視
}

import { getDb, schema } from "../lib/db/client";
import { eq } from "drizzle-orm";

const YAMADA_AUTH_USER_ID = "seed_user_001";
const YAMADA_EMAIL = "seed_yamada@example.com";

const checkSeedUser = async () => {
  console.log("\n🔍 シードユーザーの状態を確認します\n");
  console.log(`対象ユーザーID: ${YAMADA_AUTH_USER_ID}`);
  console.log(`対象メールアドレス: ${YAMADA_EMAIL}\n`);

  try {
    const db = getDb();

    // 1. userテーブルを確認
    console.log("=".repeat(80));
    console.log("📋 Step 1: userテーブルの確認");
    console.log("=".repeat(80));

    const users = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, YAMADA_AUTH_USER_ID));

    if (users.length === 0) {
      console.log(`❌ ユーザーID "${YAMADA_AUTH_USER_ID}" が見つかりません`);
      
      // メールアドレスで検索
      const usersByEmail = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, YAMADA_EMAIL));
      
      if (usersByEmail.length > 0) {
        console.log(`\n⚠️  メールアドレス "${YAMADA_EMAIL}" で別のユーザーが見つかりました:`);
        console.log(`   ユーザーID: ${usersByEmail[0].id}`);
        console.log(`   名前: ${usersByEmail[0].name}`);
        console.log(`   メール認証済み: ${usersByEmail[0].emailVerified}`);
      } else {
        console.log(`\n❌ メールアドレス "${YAMADA_EMAIL}" でも見つかりませんでした`);
      }
    } else {
      const user = users[0];
      console.log(`✅ ユーザーが見つかりました:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   名前: ${user.name}`);
      console.log(`   メールアドレス: ${user.email}`);
      console.log(`   メール認証済み: ${user.emailVerified}`);
      console.log(`   作成日時: ${user.createdAt}`);
      console.log(`   更新日時: ${user.updatedAt}`);
    }

    // 2. accountテーブルを確認
    console.log("\n" + "=".repeat(80));
    console.log("📋 Step 2: accountテーブルの確認");
    console.log("=".repeat(80));

    const accounts = await db
      .select()
      .from(schema.account)
      .where(eq(schema.account.userId, YAMADA_AUTH_USER_ID));

    if (accounts.length === 0) {
      console.log(`❌ ユーザーID "${YAMADA_AUTH_USER_ID}" に対応するaccountレコードが見つかりません`);
      
      // メールアドレスからユーザーIDを取得して再検索
      const usersByEmail = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, YAMADA_EMAIL));
      
      if (usersByEmail.length > 0) {
        const actualUserId = usersByEmail[0].id;
        const accountsByEmail = await db
          .select()
          .from(schema.account)
          .where(eq(schema.account.userId, actualUserId));
        
        if (accountsByEmail.length > 0) {
          console.log(`\n⚠️  メールアドレス "${YAMADA_EMAIL}" に対応するaccountレコードが見つかりました:`);
          const account = accountsByEmail[0];
          console.log(`   アカウントID: ${account.id}`);
          console.log(`   ユーザーID: ${account.userId}`);
          console.log(`   プロバイダーID: ${account.providerId}`);
          console.log(`   パスワードハッシュ: ${account.password ? account.password.substring(0, 20) + "..." : "NULL"}`);
          console.log(`   作成日時: ${account.createdAt}`);
        }
      }
    } else {
      const account = accounts[0];
      console.log(`✅ accountレコードが見つかりました:`);
      console.log(`   アカウントID: ${account.id}`);
      console.log(`   ユーザーID: ${account.userId}`);
      console.log(`   プロバイダーID: ${account.providerId}`);
      console.log(`   パスワードハッシュ: ${account.password ? account.password.substring(0, 30) + "..." : "NULL"}`);
      console.log(`   パスワードハッシュ長: ${account.password ? account.password.length : 0}文字`);
      console.log(`   作成日時: ${account.createdAt}`);
      console.log(`   更新日時: ${account.updatedAt}`);
      
      // パスワードハッシュの形式を確認
      if (account.password) {
        if (account.password.startsWith("$2")) {
          console.log(`   ⚠️  パスワードハッシュ形式: bcrypt形式（Better Authの期待形式と異なる可能性）`);
        } else if (account.password.startsWith("$argon2")) {
          console.log(`   ✅ パスワードハッシュ形式: argon2形式（Better Authの期待形式）`);
        } else {
          console.log(`   ⚠️  パスワードハッシュ形式: 不明（${account.password.substring(0, 10)}...）`);
        }
      } else {
        console.log(`   ❌ パスワードハッシュがNULLです`);
      }
    }

    // 3. 全ユーザー数を確認
    console.log("\n" + "=".repeat(80));
    console.log("📋 Step 3: データベース全体の状態");
    console.log("=".repeat(80));

    const allUsers = await db.select().from(schema.user);
    const allAccounts = await db.select().from(schema.account);
    
    console.log(`   全ユーザー数: ${allUsers.length}人`);
    console.log(`   全アカウント数: ${allAccounts.length}件`);
    
    const seedUsers = allUsers.filter(u => u.id.startsWith("seed_"));
    console.log(`   シードユーザー数: ${seedUsers.length}人`);
    
    if (seedUsers.length > 0) {
      console.log(`\n   シードユーザー一覧:`);
      for (const seedUser of seedUsers.slice(0, 5)) {
        console.log(`     - ${seedUser.id}: ${seedUser.email} (認証済み: ${seedUser.emailVerified})`);
      }
      if (seedUsers.length > 5) {
        console.log(`     ... 他 ${seedUsers.length - 5}人`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ 確認完了");
    console.log("=".repeat(80));
    console.log("\n");

  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
      console.error("スタックトレース:", error.stack);
    }
    process.exit(1);
  }
};

checkSeedUser();
