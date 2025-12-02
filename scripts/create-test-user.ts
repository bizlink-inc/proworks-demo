/**
 * テストユーザー作成スクリプト（PostgreSQL版）
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getDb, closePool, schema } from "../lib/db/client";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";

// ランダムID生成
const generateId = (length: number = 32): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const createTestUser = async () => {
  const db = getDb();

  // テストユーザー情報
  const email = "1test@test.com";
  const password = "test1234";
  const name = "テストユーザー";

  try {
    // ユーザーが既に存在するか確認
    const existingUser = await db.select().from(schema.user).where(eq(schema.user.email, email)).then(rows => rows[0]);

    if (existingUser) {
      console.log(`ユーザー ${email} は既に存在します。`);
      await closePool();
      process.exit(0);
    }

    // パスワードをハッシュ化
    const hashedPassword = await hashPassword(password);
    const now = new Date();
    const userId = generateId(32);
    const accountId = generateId(32);

    // ユーザーを作成
    await db.insert(schema.user).values({
      id: userId,
      name: name,
      email: email,
      emailVerified: false,
      image: null,
      createdAt: now,
      updatedAt: now,
    });

    // アカウントを作成（パスワード認証用）
    await db.insert(schema.account).values({
      id: accountId,
      userId: userId,
      accountId: email,
      providerId: "credential",
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`✅ テストユーザーを作成しました:`);
    console.log(`   メールアドレス: ${email}`);
    console.log(`   パスワード: ${password}`);
    console.log(`   名前: ${name}`);

  } catch (error) {
    console.error("エラー:", error);
  } finally {
    await closePool();
  }
};

createTestUser();
