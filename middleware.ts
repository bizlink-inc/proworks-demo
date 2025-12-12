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
 * App Runner上で、かつ開発環境（NODE_ENV !== "production"）の場合のみ有効
 * ローカル環境では無効、本番環境でも無効
 */
const isBasicAuthRequired = (request: NextRequest): boolean => {
  // 環境変数BASIC_AUTH_ENABLEDが明示的に設定されている場合
  const basicAuthEnabled = process.env.BASIC_AUTH_ENABLED;
  if (basicAuthEnabled === "true") {
    return true; // 環境変数で有効化されている場合は常に有効
  }
  if (basicAuthEnabled === "false") {
    return false; // 環境変数で無効化されている場合は常に無効
  }

  // 環境変数が設定されていない場合、App Runner上かつ開発環境の場合のみ有効
  const hostname = request.nextUrl.hostname;
  const isAppRunner = hostname.includes("awsapprunner.com");
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  // App Runner上で、かつ開発環境の場合のみ有効
  return isAppRunner && isDevelopment;
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
