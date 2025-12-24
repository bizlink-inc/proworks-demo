/**
 * データベーススキーマ作成スクリプト
 */
import { config } from "dotenv";
import { Pool } from "pg";

// 環境変数を読み込む
config({ path: ".env.local" });
// .aws-resources.envが存在する場合は読み込む（オプション）
try {
  config({ path: ".aws-resources.env" });
} catch {
  // ファイルが存在しない場合は無視
}

const createSchema = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL環境変数が設定されていません");
  }

  console.log("📦 データベーススキーマを作成します");
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("rds.amazonaws.com") ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  
  try {
    // テーブル作成SQL
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        image TEXT,
        "lastName" TEXT,
        "firstName" TEXT,
        phone TEXT,
        "birthDate" TEXT,
        "createdAt" TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL
      );
    `);
    console.log("✅ userテーブルを作成しました");

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
    console.log("✅ sessionテーブルを作成しました");

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
    console.log("✅ accountテーブルを作成しました");

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
    console.log("✅ verificationテーブルを作成しました");

    console.log("\n✅ すべてのテーブルを作成しました");
  } catch (error: any) {
    console.error("❌ エラーが発生しました:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createSchema().catch((error) => {
  console.error(error);
  process.exit(1);
});

