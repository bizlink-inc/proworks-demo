/**
 * PostgreSQL データベースクライアント
 * ローカル開発環境と AWS App Runner の両方で使用
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// データベース接続URL
const getDatabaseUrl = (): string => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // ローカル開発環境のデフォルト
  return "postgresql://ss@localhost:5432/proworks_local";
};

// PostgreSQL プール（シングルトン）
let pool: Pool | null = null;

const getPool = (): Pool => {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    pool = new Pool({
      connectionString,
      // RDS接続時にSSL証明書の検証をスキップ（開発環境用）
      ssl: connectionString.includes("rds.amazonaws.com") ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
};

// Drizzle ORM インスタンスを取得
export const getDb = () => {
  return drizzle(getPool(), { schema });
};

// プールを閉じる（スクリプト終了時に使用）
export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

// 直接 SQL を実行する（マイグレーション用）
export const query = async (sql: string, params?: unknown[]) => {
  const client = await getPool().connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
};

export { schema };

