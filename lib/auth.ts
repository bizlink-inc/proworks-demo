import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import crypto from "crypto";
import * as schema from "./db/schema";

// 環境判定
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

// データベース接続URL
// ローカル: postgresql://ss@localhost:5432/proworks_local
// Cloud Run: 環境変数 DATABASE_URL から取得
const getDatabaseUrl = (): string => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // ローカル開発環境のデフォルト
  return "postgresql://ss@localhost:5432/proworks_local";
};

// better-auth インスタンスの初期化
let auth: ReturnType<typeof betterAuth>;

// Vercel 環境（認証無効）
if (isVercel) {
  auth = {
    api: {
      getSession: async () => null,
    },
    handler: async () => new Response("Not available in demo", { status: 503 }),
  } as unknown as ReturnType<typeof betterAuth>;
} 
// PostgreSQL を使用（ローカル開発 & Cloud Run）
else {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });
  const db = drizzle(pool, { schema });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const isDevelopment = process.env.NODE_ENV === "development";

  auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    secret: process.env.BETTER_AUTH_SECRET || "demo-secret-key-for-development",
    baseURL: appUrl,
    basePath: "/api/auth",
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        if (isDevelopment) {
          console.log("\n" + "=".repeat(80));
          console.log("🔑 パスワードリセットリンク");
          console.log("=".repeat(80));
          console.log(`宛先: ${user.email}`);
          console.log(`リンク: ${url}`);
          console.log("=".repeat(80) + "\n");
          return;
        }
        // 本番環境ではメール送信サービスを使用
        console.log(`[Password Reset] User: ${user.email}, URL: ${url}`);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const callbackUrl = `${appUrl}/api/auth/callback`;
        const verificationUrl = url.includes("callbackURL")
          ? url.replace(/callbackURL=[^&]*/, `callbackURL=${encodeURIComponent(callbackUrl)}`)
          : `${url}&callbackURL=${encodeURIComponent(callbackUrl)}`;

        if (isDevelopment) {
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
        // 本番環境ではメール送信サービスを使用
        console.log(`[Email Verification] User: ${user.email}, URL: ${verificationUrl}`);
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
      appUrl,
    ].filter(Boolean),
  });
}

export { auth, generateRandomPassword, isVercel };

// データベース接続を取得する関数（他のファイルで使用）
export const getDb = () => {
  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });
  return drizzle(pool, { schema });
};

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
