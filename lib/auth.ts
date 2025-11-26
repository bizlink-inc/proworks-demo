import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import crypto from "crypto";

// Vercel 環境かどうかを判定
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

// ランダムなパスワードを生成する関数
const generateRandomPassword = () => {
  return crypto.randomBytes(16).toString("hex");
};

// デモ用ユーザー情報（yamada）
export const DEMO_USER = {
  id: "seed_user_001",
  name: "山田 太郎",
  email: "seed_yamada@example.com",
  password: "password123",
  emailVerified: true,
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Vercel 環境では better-auth を初期化しない
// ローカル環境でのみ動作
let auth: ReturnType<typeof betterAuth>;

if (!isVercel) {
  // ローカル環境では SQLite + drizzle を使用
  const Database = require("better-sqlite3");
  const { drizzle } = require("drizzle-orm/better-sqlite3");
  const path = require("path");
  const schema = require("./db/schema");

  const dbPath = path.join(process.cwd(), "auth.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  const db = drizzle(sqlite, { schema });

  auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "better-sqlite3",
    }),
    secret: process.env.BETTER_AUTH_SECRET || "demo-secret-key-for-development",
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    basePath: "/api/auth",
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        if (process.env.NODE_ENV === "development") {
          console.log("\n" + "=".repeat(80));
          console.log("🔑 パスワードリセットリンク");
          console.log("=".repeat(80));
          console.log(`宛先: ${user.email}`);
          console.log(`リンク: ${url}`);
          console.log("=".repeat(80) + "\n");
          return;
        }
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
        const verificationUrl = url.includes("callbackURL")
          ? url.replace(/callbackURL=[^&]*/, `callbackURL=${encodeURIComponent(callbackUrl)}`)
          : `${url}&callbackURL=${encodeURIComponent(callbackUrl)}`;

        if (process.env.NODE_ENV === "development") {
          console.log("\n" + "=".repeat(80));
          console.log("📧 【PRO WORKS】メールアドレスの確認");
          console.log("=".repeat(80));
          console.log(`宛先: ${user.email}`);
          console.log("");
          console.log("以下のリンクをクリックして、メールアドレスの確認を完了してください。");
          console.log("");
          console.log(`▶ ${verificationUrl}`);
          console.log("");
          console.log("※ このリンクの有効期限は1時間です。");
          console.log("=".repeat(80) + "\n");
          return;
        }
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    trustedOrigins: [
      "http://localhost:3000",
      "http://192.168.100.5:3000",
      process.env.NEXT_PUBLIC_APP_URL || "",
    ].filter(Boolean),
  });
} else {
  // Vercel 環境ではダミーの auth オブジェクトを作成
  // API は別途ハンドリングする
  auth = {
    api: {
      getSession: async () => null,
    },
    handler: async () => new Response("Not available in demo", { status: 503 }),
  } as unknown as ReturnType<typeof betterAuth>;
}

export { auth, generateRandomPassword, isVercel };

export type Session = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string;
  };
};

export type User = Session["user"];
