import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { token, password } = body;

    console.log("📧 パスワードリセット実行:", { token: token?.substring(0, 10) + "..." });

    if (!token || !password) {
      return NextResponse.json(
        { error: "トークンとパスワードが必要です" },
        { status: 400 }
      );
    }

    // Better Auth の resetPassword API を呼び出し
    try {
      await auth.api.resetPassword({
        body: {
          token,
          newPassword: password,
        },
      });
      console.log("✅ パスワードリセット成功");

      return NextResponse.json(
        { message: "パスワードがリセットされました" },
        { status: 200 }
      );
    } catch (error) {
      console.error("❌ パスワードリセットエラー:", error);
      return NextResponse.json(
        { error: "無効または期限切れのトークンです" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("パスワードリセットエラー:", error);
    return NextResponse.json(
      { error: "パスワードのリセットに失敗しました" },
      { status: 500 }
    );
  }
};
