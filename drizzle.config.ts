import type { Config } from "drizzle-kit";

// RDS接続用のURLを取得（SSL設定を含む）
const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL || "postgresql://ss@localhost:5432/proworks_local";
  // RDSの場合、SSL設定を追加（URLに既に含まれている場合はそのまま使用）
  if (url.includes("rds.amazonaws.com") && !url.includes("sslmode")) {
    return url + (url.includes("?") ? "&" : "?") + "sslmode=no-verify";
  }
  return url;
};

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // ローカル開発環境: Homebrew PostgreSQL
    // RDS: DATABASE_URL 環境変数を使用（SSL設定付き）
    url: getDatabaseUrl(),
  },
} satisfies Config;
