/**
 * テストユーザー削除スクリプト（PostgreSQL版）
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getDb, closePool, schema } from "../lib/db/client";
import { createTalentClient, getAppIds } from "../lib/kintone/client";
import { eq } from "drizzle-orm";

const deleteTestUser = async (email: string) => {
  console.log(`\n🗑️  テストユーザーを削除します: ${email}\n`);

  const db = getDb();

  try {
    // ユーザーIDを取得
    const user = await db.select().from(schema.user).where(eq(schema.user.email, email)).then(rows => rows[0]);

    if (user) {
      console.log(`✓ PostgreSQLでユーザーを発見: ${user.id}`);

      // セッションを削除
      const sessionResult = await db.delete(schema.session).where(eq(schema.session.userId, user.id));
      console.log(`✓ セッションを削除`);

      // アカウントを削除
      const accountResult = await db.delete(schema.account).where(eq(schema.account.userId, user.id));
      console.log(`✓ アカウントを削除`);

      // ユーザーを削除
      const userResult = await db.delete(schema.user).where(eq(schema.user.id, user.id));
      console.log(`✓ ユーザーを削除`);

      // kintoneから人材情報を削除
      try {
        const client = createTalentClient();
        const appId = getAppIds().talent;

        const response = await client.record.getRecords({
          app: appId,
          query: `メールアドレス = "${email}"`,
        });

        if (response.records.length > 0) {
          const recordId = response.records[0].$id.value;
          await client.record.deleteRecords({
            app: appId,
            ids: [recordId],
          });
          console.log(`✓ kintoneから人材情報を削除: レコードID ${recordId}`);
        } else {
          console.log(`⚠️  kintoneに該当する人材情報が見つかりませんでした`);
        }
      } catch (kintoneError) {
        console.error(`⚠️ kintone削除エラー:`, kintoneError);
      }

      console.log(`\n✅ 削除完了: ${email}\n`);
    } else {
      console.log(`⚠️  該当するユーザーが見つかりませんでした: ${email}\n`);
    }
  } catch (error) {
    console.error(`\n❌ エラーが発生しました:`, error);
  } finally {
    await closePool();
  }
};

// コマンドライン引数からメールアドレスを取得
const email = process.argv[2];

if (!email) {
  console.error("\n❌ メールアドレスを指定してください");
  console.log("\n使用方法:");
  console.log("  npm run delete-user <email>\n");
  console.log("例:");
  console.log("  npm run delete-user test@example.com\n");
  process.exit(1);
}

deleteTestUser(email);
