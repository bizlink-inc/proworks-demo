/**
 * PostgreSQL データベースクライアント
 * ローカル開発環境と Cloud Run の両方で使用
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
    pool = new Pool({
      connectionString: getDatabaseUrl(),
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

