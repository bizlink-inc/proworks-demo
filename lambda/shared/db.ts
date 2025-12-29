/**
 * Lambda用 PostgreSQL データベースクライアント
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

// スキーマ定義（Lambda用に最小限）
export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey().default("default"),
  scoreThreshold: integer("score_threshold").notNull().default(3),
  maxPerJob: integer("max_per_job").notNull().default(50),
  lastBatchTime: timestamp("last_batch_time"),
  lastThreshold: integer("last_threshold"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// PostgreSQL プール
let pool: Pool | null = null;

const getPool = (): Pool => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined");
    }
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("rds.amazonaws.com")
        ? { rejectUnauthorized: false }
        : false,
    });
  }
  return pool;
};

export const getDb = () => {
  return drizzle(getPool());
};

export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

// 設定取得
export interface DbSettings {
  scoreThreshold: number;
  lastBatchTime: Date | null;
  lastThreshold: number | null;
}

const DEFAULT_THRESHOLD = 3;

export const getSettingsFromDb = async (): Promise<DbSettings> => {
  try {
    const db = getDb();
    const settings = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.id, "default"))
      .limit(1);

    if (settings.length === 0) {
      return {
        scoreThreshold: DEFAULT_THRESHOLD,
        lastBatchTime: null,
        lastThreshold: null,
      };
    }

    return {
      scoreThreshold: settings[0].scoreThreshold,
      lastBatchTime: settings[0].lastBatchTime,
      lastThreshold: settings[0].lastThreshold,
    };
  } catch (error) {
    console.warn("DB設定の取得に失敗:", error);
    return {
      scoreThreshold: DEFAULT_THRESHOLD,
      lastBatchTime: null,
      lastThreshold: null,
    };
  }
};

// バッチ状態を更新
export const updateBatchState = async (threshold: number): Promise<void> => {
  try {
    const db = getDb();
    const now = new Date();

    await db
      .insert(appSettings)
      .values({
        id: "default",
        scoreThreshold: DEFAULT_THRESHOLD,
        lastBatchTime: now,
        lastThreshold: threshold,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: appSettings.id,
        set: {
          lastBatchTime: now,
          lastThreshold: threshold,
          updatedAt: now,
        },
      });
  } catch (error) {
    console.error("バッチ状態の更新に失敗:", error);
    throw error;
  }
};
