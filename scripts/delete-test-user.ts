import Database from "better-sqlite3";
import { createTalentClient, getAppIds } from "../lib/kintone/client";
import path from "path";

const deleteTestUser = async (email: string) => {
  console.log(`\n🗑️  テストユーザーを削除します: ${email}\n`);

  // 1. PostgreSQL (auth.db) からユーザーを削除
  const dbPath = path.join(process.cwd(), "auth.db");
  const db = new Database(dbPath);

  try {
    // ユーザーIDを取得
    const user = db.prepare("SELECT id FROM user WHERE email = ?").get(email) as { id: string } | undefined;

    if (user) {
      console.log(`✓ PostgreSQLでユーザーを発見: ${user.id}`);

      // セッションを削除
      const sessionResult = db.prepare("DELETE FROM session WHERE userId = ?").run(user.id);
      console.log(`✓ セッションを削除: ${sessionResult.changes}件`);

      // アカウントを削除
      const accountResult = db.prepare("DELETE FROM account WHERE userId = ?").run(user.id);
      console.log(`✓ アカウントを削除: ${accountResult.changes}件`);

      // ユーザーを削除
      const userResult = db.prepare("DELETE FROM user WHERE id = ?").run(user.id);
      console.log(`✓ ユーザーを削除: ${userResult.changes}件`);

      // 2. kintoneから人材情報を削除
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

      console.log(`\n✅ 削除完了: ${email}\n`);
    } else {
      console.log(`⚠️  該当するユーザーが見つかりませんでした: ${email}\n`);
    }
  } catch (error) {
    console.error(`\n❌ エラーが発生しました:`, error);
  } finally {
    db.close();
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

