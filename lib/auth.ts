import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import crypto from "crypto";
import * as schema from "./db/schema";
import { sendVerificationEmail, sendPasswordResetEmail, logEmailToConsole } from "./email";

// ランダムなパスワードを生成する関数
const generateRandomPassword = () => {
  return crypto.randomBytes(16).toString("hex");
};

// データベース接続URL
// ローカル: postgresql://ss@localhost:5432/proworks_local
// AWS RDS: 環境変数 DATABASE_URL から取得
const getDatabaseUrl = (): string => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // ローカル開発環境のデフォルト
  return "postgresql://ss@localhost:5432/proworks_local";
};

// PostgreSQL プールを作成
const connectionString = getDatabaseUrl();
const pool = new Pool({
  connectionString,
  // RDS接続時にSSL証明書の検証をスキップ（AWS RDSへの接続に必要）
  ssl: connectionString.includes("rds.amazonaws.com") ? { rejectUnauthorized: false } : false,
});
const db = drizzle(pool, { schema });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const isDevelopment = process.env.NODE_ENV === "development";

// better-auth インスタンスの初期化
const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
  secret: process.env.BETTER_AUTH_SECRET || "demo-secret-key-for-development-must-be-32-chars-min",
    baseURL: appUrl,
    basePath: "/api/auth",
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        // 開発環境: コンソール出力
        if (isDevelopment) {
          logEmailToConsole("reset", user.email, url);
          return;
        }
      // 本番環境: Amazon SES でメール送信
        const result = await sendPasswordResetEmail(user.email, url);
        if (!result.success) {
          console.error(`❌ パスワードリセットメール送信失敗: ${user.email}`, result.error);
        }
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

        // 開発環境: コンソール出力
        if (isDevelopment) {
          logEmailToConsole("verification", user.email, verificationUrl);
          return;
        }
      // 本番環境: Amazon SES でメール送信
        const result = await sendVerificationEmail(user.email, verificationUrl);
        if (!result.success) {
          console.error(`❌ メールアドレス確認メール送信失敗: ${user.email}`, result.error);
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
      appUrl,
      // AWS App Runner URLs
      "https://shqzybdxje.ap-northeast-1.awsapprunner.com",
      process.env.APP_RUNNER_URL,
    ].filter(Boolean) as string[],
  });

export { auth, generateRandomPassword };

// データベース接続を取得する関数（他のファイルで使用）
export const getDb = () => {
  const connString = getDatabaseUrl();
  const pool = new Pool({
    connectionString: connString,
    // RDS接続時にSSL証明書の検証をスキップ（AWS RDSへの接続に必要）
    ssl: connString.includes("rds.amazonaws.com") ? { rejectUnauthorized: false } : false,
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
