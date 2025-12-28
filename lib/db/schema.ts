/**
 * PostgreSQL 用のスキーマ定義
 * ローカル開発環境と AWS App Runner (RDS PostgreSQL) の両方で使用
 */
import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  lastName: text("lastName"),
  firstName: text("firstName"),
  phone: text("phone"),
  birthDate: text("birthDate"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

/**
 * アプリケーション設定テーブル
 * バッチ処理のスコア閾値などを保存
 */
export const appSettings = pgTable("app_settings", {
  id: text("id").primaryKey().default("default"),
  scoreThreshold: integer("score_threshold").notNull().default(3),
  maxPerJob: integer("max_per_job").notNull().default(50),
  lastBatchTime: timestamp("last_batch_time"),  // 前回バッチ実行日時（差分計算用）
  lastThreshold: integer("last_threshold"),     // 前回バッチ実行時の閾値（閾値変更検知用）
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
