import { NextRequest, NextResponse } from "next/server";

export const middleware = (request: NextRequest) => {
  // 現在は何も処理しない（必要に応じて追加）
  return NextResponse.next();
};

export const config = {
  matcher: [
    // すべてのパスにマッチ、ただし以下は除外
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
