/**
 * 管理者認証モジュール
 * シンプルなハードコード認証（開発・デモ用）
 */

import { cookies } from "next/headers";

// ハードコードされた管理者認証情報
const ADMIN_CREDENTIALS = {
  email: "admin@example.com",
  password: "admin123",
};

// セッションクッキー名
const ADMIN_SESSION_COOKIE = "admin_session";

// セッショントークン（シンプルな固定値、本番では動的に生成すべき）
const SESSION_TOKEN = "admin_authenticated_token_2024";

/**
 * 管理者認証を検証
 */
export const verifyAdminCredentials = (email: string, password: string): boolean => {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
};

/**
 * 管理者セッションを作成
 */
export const createAdminSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, SESSION_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24時間
  });
};

/**
 * 管理者セッションを検証
 */
export const verifyAdminSession = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE);
  return session?.value === SESSION_TOKEN;
};

/**
 * 管理者セッションを削除（ログアウト）
 */
export const destroyAdminSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
};

/**
 * デフォルトの認証情報を取得（デバッグ用）
 */
export const getDefaultCredentials = () => ({
  email: ADMIN_CREDENTIALS.email,
  password: ADMIN_CREDENTIALS.password,
});

