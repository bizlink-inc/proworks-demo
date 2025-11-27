import { auth, isVercel, DEMO_USER } from "@/lib/auth";
import { createDemoSession, destroyDemoSession } from "@/lib/auth-server";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

// Vercel 環境用のデモ認証ハンドラー
const handleDemoAuth = async (request: NextRequest): Promise<Response> => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // サインイン処理
  if (pathname.endsWith("/sign-in/email") && request.method === "POST") {
    try {
      const body = await request.json();
      const { email, password } = body;

      // yamada ユーザーの認証情報を確認
      if (email === DEMO_USER.email && password === DEMO_USER.password) {
        // デモセッションを作成
        await createDemoSession();

        return NextResponse.json({
          user: {
            id: DEMO_USER.id,
            name: DEMO_USER.name,
            email: DEMO_USER.email,
            emailVerified: true,
            image: null,
            createdAt: DEMO_USER.createdAt.toISOString(),
            updatedAt: DEMO_USER.updatedAt.toISOString(),
          },
          session: {
            id: "demo_session_001",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            token: "demo_token",
          },
        });
      }

      return NextResponse.json(
        { message: "メールアドレスまたはパスワードが正しくありません" },
        { status: 401 }
      );
    } catch (error) {
      return NextResponse.json(
        { message: "ログインに失敗しました" },
        { status: 500 }
      );
    }
  }

  // サインアウト処理
  if (pathname.endsWith("/sign-out") && request.method === "POST") {
    await destroyDemoSession();
    return NextResponse.json({ success: true });
  }

  // セッション取得
  if (pathname.endsWith("/get-session") && request.method === "GET") {
    const { verifyDemoSession } = await import("@/lib/auth-server");
    const hasDemoSession = await verifyDemoSession();

    if (hasDemoSession) {
      return NextResponse.json({
        user: {
          id: DEMO_USER.id,
          name: DEMO_USER.name,
          email: DEMO_USER.email,
          emailVerified: true,
          image: null,
          createdAt: DEMO_USER.createdAt.toISOString(),
          updatedAt: DEMO_USER.updatedAt.toISOString(),
        },
        session: {
          id: "demo_session_001",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          token: "demo_token",
        },
      });
    }

    return NextResponse.json(null);
  }

  // その他のエンドポイントはデモ環境では利用不可
  return NextResponse.json(
    { message: "この機能はデモ環境では利用できません" },
    { status: 503 }
  );
};

// better-auth ハンドラーを事前に作成
const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

// Vercel 環境ではデモ認証、ローカルでは better-auth を使用
export const GET = async (request: NextRequest) => {
  if (isVercel) {
    return handleDemoAuth(request);
  }
  return authGET(request);
};

export const POST = async (request: NextRequest) => {
  if (isVercel) {
    return handleDemoAuth(request);
  }
  return authPOST(request);
};
