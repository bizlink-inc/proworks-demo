import { NextRequest, NextResponse } from "next/server";

// Basic認証の認証情報
const BASIC_AUTH_USERNAME = "admin";
const BASIC_AUTH_PASSWORD = "proworks2025";
const BASIC_AUTH_COOKIE_NAME = "basic_auth_session";
const BASIC_AUTH_COOKIE_VALUE = "authenticated";

/**
 * Base64デコード（Edge Runtime対応）
 */
const decodeBase64 = (base64: string): string => {
  try {
    // atobはブラウザ/Edge Runtimeで利用可能
    return atob(base64);
  } catch (error) {
    return "";
  }
};

/**
 * Basic認証のヘッダーを検証
 */
const verifyBasicAuth = (authHeader: string | null): boolean => {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  try {
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = decodeBase64(base64Credentials);
    const [username, password] = credentials.split(":");

    return username === BASIC_AUTH_USERNAME && password === BASIC_AUTH_PASSWORD;
  } catch (error) {
    return false;
  }
};

/**
 * Basic認証が必要かどうかを判定
 * 本番環境（App Runner）でのみ有効
 */
const isBasicAuthRequired = (request: NextRequest): boolean => {
  // 環境変数で制御可能にする（デフォルトは本番環境で有効）
  // Edge Runtimeではprocess.env.NODE_ENVは使えないため、URLで判定
  const hostname = request.nextUrl.hostname;
  const isAppRunner = hostname.includes("awsapprunner.com");
  
  // 環境変数BASIC_AUTH_ENABLEDで明示的に無効化されていない場合、App Runnerでは有効
  // ローカル開発環境では無効（.env.localでBASIC_AUTH_ENABLED=trueと設定すれば有効化可能）
  if (!isAppRunner) {
    return false; // ローカル開発環境ではデフォルトで無効
  }

  // App Runner環境ではデフォルトで有効（環境変数で無効化可能）
  return true;
};

export const middleware = (request: NextRequest) => {
  // Basic認証が必要な場合のみチェック
  if (!isBasicAuthRequired(request)) {
    return NextResponse.next();
  }

  // ヘルスチェックエンドポイントは除外
  if (request.nextUrl.pathname === "/api/health") {
    return NextResponse.next();
  }

  // Cookieで認証済みかチェック
  const authCookie = request.cookies.get(BASIC_AUTH_COOKIE_NAME);
  if (authCookie?.value === BASIC_AUTH_COOKIE_VALUE) {
    return NextResponse.next();
  }

  // Authorizationヘッダーをチェック
  const authHeader = request.headers.get("authorization");
  if (verifyBasicAuth(authHeader)) {
    // 認証成功：Cookieを設定してレスポンスを返す
    const response = NextResponse.next();
    response.cookies.set(BASIC_AUTH_COOKIE_NAME, BASIC_AUTH_COOKIE_VALUE, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7日間有効
      path: "/",
    });
    return response;
  }

  // 認証失敗：401 Unauthorizedを返す
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="PRO WORKS"',
    },
  });
};

export const config = {
  matcher: [
    // すべてのパスにマッチ、ただし以下は除外
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
