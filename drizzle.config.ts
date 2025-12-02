import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // ローカル開発環境: Homebrew PostgreSQL
    // Cloud Run: DATABASE_URL 環境変数を使用
    url: process.env.DATABASE_URL || "postgresql://ss@localhost:5432/proworks_local",
  },
} satisfies Config;
