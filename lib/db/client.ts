/**
 * PostgreSQL データベースクライアント
 * ローカル開発環境と AWS App Runner の両方で使用
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// データベース接続URL定数
const LOCAL_DB_URL = "postgresql://ss@localhost:5432/proworks_local";

// データベース接続URL
// USE_LOCAL_DB=true: ローカルDB（postgresql://ss@localhost:5432/proworks_local）を使用
// USE_LOCAL_DB=false または未設定: DATABASE_URL（AWS RDS）を使用
const getDatabaseUrl = (): string => {
  // ローカル開発モードの場合はローカルDBを使用
  if (process.env.USE_LOCAL_DB === "true") {
    return LOCAL_DB_URL;
  }
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // フォールバック: ローカル開発環境のデフォルト
  return LOCAL_DB_URL;
};

// PostgreSQL プール（シングルトン）
let pool: Pool | null = null;
let currentDbTarget: "local" | "rds" | null = null;

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

// データベースを切り替える（シードスクリプト用）
export const switchDatabase = async (target: "local" | "rds"): Promise<void> => {
  // 現在のプールを閉じる
  if (pool) {
    await pool.end();
    pool = null;
  }

  // 接続先を決定
  const connectionString = target === "local"
    ? LOCAL_DB_URL
    : process.env.DATABASE_URL || LOCAL_DB_URL;

  // 新しいプールを作成
  pool = new Pool({
    connectionString,
    ssl: connectionString.includes("rds.amazonaws.com") ? { rejectUnauthorized: false } : false,
  });
  currentDbTarget = target;

  console.log(`🔗 データベース切り替え: ${target === "local" ? "ローカルDB" : "AWS RDS"}`);
};

// 現在のDB接続先を取得
export const getCurrentDbTarget = (): "local" | "rds" | null => currentDbTarget;

export { schema };

