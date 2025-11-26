import { NextRequest, NextResponse } from "next/server";

const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME || "admin";
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || "proworks2025";

const validateBasicAuth = (authHeader: string | null): boolean => {
  if (!authHeader) {
    return false;
  }

  const credentials = authHeader.replace("Basic ", "");
  const decoded = Buffer.from(credentials, "base64").toString();
  const [username, password] = decoded.split(":");

  return username === BASIC_AUTH_USERNAME && password === BASIC_AUTH_PASSWORD;
};

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // API ルート以下は認証をスキップ
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 認証チェック
  const authHeader = request.headers.get("authorization");
  const isAuthenticated = validateBasicAuth(authHeader);

  if (!isAuthenticated) {
    // 認証なしの場合、401 Unauthorized を返して Basic 認証ダイアログを表示
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="PROWORKS Demo"',
      },
    });
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    // すべてのパスにマッチ、ただし以下は除外
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

