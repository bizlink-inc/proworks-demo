import { auth, isVercel, DEMO_USER, type Session } from "./auth";
import { headers, cookies } from "next/headers";

// デモ用セッションクッキー名
const DEMO_SESSION_COOKIE = "demo_session";

// デモ用セッションを作成
export const createDemoSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_SESSION_COOKIE, DEMO_USER.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24時間
  });
};

// デモ用セッションを削除
export const destroyDemoSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_SESSION_COOKIE);
};

// デモ用セッションを検証
export const verifyDemoSession = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const session = cookieStore.get(DEMO_SESSION_COOKIE);
  return session?.value === DEMO_USER.id;
};

export const getSession = async (): Promise<Session | null> => {
  // Vercel 環境ではデモセッションを確認
  if (isVercel) {
    const hasDemoSession = await verifyDemoSession();
    
    if (hasDemoSession) {
      // yamada ユーザーとしてセッションを返す
      return {
        user: {
          id: DEMO_USER.id,
          name: DEMO_USER.name,
          email: DEMO_USER.email,
          emailVerified: true,
          image: null,
          createdAt: DEMO_USER.createdAt,
          updatedAt: DEMO_USER.updatedAt,
        },
        session: {
          id: "demo_session_001",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          token: "demo_token",
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
          userId: DEMO_USER.id,
        },
      };
    }
    
    return null;
  }

  // ローカル環境では通常の better-auth セッションを取得
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session as Session | null;
  } catch (error) {
    console.error("セッション取得エラー:", error);
    return null;
  }
};

export const requireAuth = async (): Promise<Session> => {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
};
