import Database from "better-sqlite3";
import { hash } from "better-auth/utils";

const db = new Database("./auth.db");

// テストユーザーを作成
const email = "1test@test.com";
const password = "test1234";
const name = "テストユーザー";

// パスワードをハッシュ化
const hashedPassword = await hash(password);

// ユーザーが既に存在するか確認
const existingUser = db.prepare("SELECT * FROM user WHERE email = ?").get(email);

if (existingUser) {
  console.log(`ユーザー ${email} は既に存在します。`);
  process.exit(0);
}

// ユーザーを作成
const result = db
  .prepare(
    "INSERT INTO user (email, emailVerified, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)"
  )
  .run(email, false, name, new Date().toISOString(), new Date().toISOString());

const userId = result.lastInsertRowid;

// パスワードを保存
db.prepare(
  "INSERT INTO account (userId, accountId, providerId, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)"
).run(
  userId,
  email,
  "credential",
  hashedPassword,
  new Date().toISOString(),
  new Date().toISOString()
);

console.log(`✅ テストユーザーを作成しました:`);
console.log(`   メールアドレス: ${email}`);
console.log(`   パスワード: ${password}`);
console.log(`   名前: ${name}`);

db.close();

