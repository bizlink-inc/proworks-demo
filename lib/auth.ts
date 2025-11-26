import { betterAuth } from "better-auth";
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
  // ローカル環境では通常通り better-auth を初期化
  auth = betterAuth({
    database: {
      provider: "sqlite",
      url: ":memory:",
    },
    secret: process.env.BETTER_AUTH_SECRET || "demo-secret-key-for-development",
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    basePath: "/api/auth",
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
      requireEmailVerification: false,
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
