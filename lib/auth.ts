import { betterAuth } from "better-auth";
import crypto from "crypto";

// Vercel 環境かどうかを判定
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

// ランダムなパスワードを生成する関数
const generateRandomPassword = () => {
  return crypto.randomBytes(16).toString("hex");
};

// Vercel 環境では SQLite を使用せず、メモリ DB を使用
// 注意: この状態ではユーザー認証機能は正常に動作しません
// デモ目的では管理者ログイン（ハードコード）を使用してください
export const auth = betterAuth({
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
    requireEmailVerification: false, // Vercel 環境ではメール認証を無効化
    sendResetPassword: async ({ user, url }) => {
      // パスワードリセットメール送信
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
    sendOnSignUp: false, // Vercel 環境ではメール送信を無効化
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      // コールバックURLをマイページに設定
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
      const verificationUrl = url.includes('callbackURL') 
        ? url.replace(/callbackURL=[^&]*/, `callbackURL=${encodeURIComponent(callbackUrl)}`)
        : `${url}&callbackURL=${encodeURIComponent(callbackUrl)}`;

      // 開発環境ではコンソールに出力
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
        console.log("※ このメールに心当たりがない場合は、削除してください。");
        console.log("=".repeat(80) + "\n");
        return;
      }
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5分
    },
  },
  // 開発環境でネットワークアドレスからのアクセスを許可
  trustedOrigins: [
    "http://localhost:3000",
    "http://192.168.100.5:3000",
    process.env.NEXT_PUBLIC_APP_URL || "",
  ].filter(Boolean),
});

export { generateRandomPassword };

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
