import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./db/schema";
import crypto from "crypto";

const dbPath = path.join(process.cwd(), "auth.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

const db = drizzle(sqlite, { schema });

// ランダムなパスワードを生成する関数
const generateRandomPassword = () => {
  return crypto.randomBytes(16).toString("hex");
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "better-sqlite3",
  }),
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    requireEmailVerification: true, // メール認証を必須にする
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
    sendOnSignUp: true, // サインアップ時にメール送信
    autoSignInAfterVerification: true, // メール認証後に自動ログイン
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

      // 本番環境ではResendを使用（後で実装）
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // await resend.emails.send({
      //   from: "noreply@yourapp.com",
      //   to: user.email,
      //   subject: "【PRO WORKS】メールアドレスの確認",
      //   html: `
      //     <h2>メールアドレスの確認</h2>
      //     <p>${user.email} 様</p>
      //     <p>PRO WORKS にご登録いただきありがとうございます。</p>
      //     <p>以下のリンクをクリックして、メールアドレスの確認を完了してください。</p>
      //     <p><a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">メールアドレスを確認する</a></p>
      //     <p>または、以下のURLをブラウザにコピーしてください：</p>
      //     <p style="color: #666; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
      //     <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      //     <p style="color: #999; font-size: 12px;">
      //       ※ このリンクの有効期限は1時間です。<br>
      //       ※ このメールに心当たりがない場合は、削除してください。
      //     </p>
      //   `,
      // });
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
  ],
});

export { generateRandomPassword };

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
