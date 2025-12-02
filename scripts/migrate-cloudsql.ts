/**
 * Cloud SQL (PostgreSQL) へのマイグレーション & シードデータ投入スクリプト
 * 
 * 使い方:
 * 1. Cloud SQL Proxy を起動: cloud-sql-proxy bizlink-gcp:asia-northeast1:proworks-db --port=5432
 * 2. このスクリプトを実行: npx tsx scripts/migrate-cloudsql.ts
 */

import { Pool } from "pg";
import crypto from "crypto";
// Better Authの公式ハッシュ関数を使用
import { hashPassword } from "better-auth/crypto";

// Cloud SQL への接続設定（ローカルからプロキシ経由）
const pool = new Pool({
  host: "127.0.0.1",
  port: 5432,
  database: "proworks_db",
  user: "proworks",
  password: "ProWorks2024Secure!",
});

// ランダムID生成（Better Auth互換）
const generateId = (length: number = 32): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// デモ用ユーザー情報
const DEMO_USER = {
  id: "seed_user_001",
  name: "山田 太郎",
  email: "seed_yamada@example.com",
  password: "password123",
};

const migrate = async () => {
  const client = await pool.connect();
  
  try {
    console.log("🔄 Cloud SQL に接続中...");
    
    // テーブル作成
    console.log("📦 テーブルを作成中...");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        image TEXT,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        id TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS account (
        id TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP,
        "updatedAt" TIMESTAMP
      );
    `);
    
    console.log("✅ テーブル作成完了");
    
    // シードデータ投入
    console.log("🌱 シードデータを投入中...");
    
    const now = new Date();
    
    // Better Auth の公式ハッシュ関数を使用
    console.log("🔐 パスワードをハッシュ化中...");
    const hashedPassword = await hashPassword(DEMO_USER.password);
    console.log("✅ パスワードハッシュ完了");
    
    // 既存のデータを削除（あれば）
    await client.query(`DELETE FROM account WHERE "userId" = $1`, [DEMO_USER.id]);
    await client.query(`DELETE FROM session WHERE "userId" = $1`, [DEMO_USER.id]);
    await client.query(`DELETE FROM "user" WHERE id = $1`, [DEMO_USER.id]);
    
    // ユーザー作成
    await client.query(`
      INSERT INTO "user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [DEMO_USER.id, DEMO_USER.name, DEMO_USER.email, true, null, now, now]);
    
    console.log("✅ ユーザー作成完了");
    
    // アカウント作成（パスワード認証用）
    const accountId = generateId();
    await client.query(`
      INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [accountId, DEMO_USER.id, "credential", DEMO_USER.id, hashedPassword, now, now]);
    
    console.log("✅ アカウント作成完了");
    
    console.log("");
    console.log("📋 作成したユーザー:");
    console.log(`   メール: ${DEMO_USER.email}`);
    console.log(`   パスワード: ${DEMO_USER.password}`);
    console.log("");
    console.log("🎉 マイグレーション完了！");
    
  } catch (error) {
    console.error("❌ エラー:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch(console.error);
