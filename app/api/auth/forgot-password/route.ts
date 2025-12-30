import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスが必要です" },
        { status: 400 }
      );
    }

    console.log("📧 パスワードリセットリクエスト:", email);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Better Auth の requestPasswordReset API を呼び出し
    try {
      await auth.api.requestPasswordReset({
        body: {
          email,
          redirectTo: `${appUrl}/auth/reset-password`,
        },
      });
      console.log("✅ パスワードリセットメール送信完了:", email);
    } catch (error) {
      // ユーザーが存在しない場合などのエラーは無視（セキュリティ対策）
      console.log("⚠️ パスワードリセット処理:", error instanceof Error ? error.message : "エラー");
    }

    // セキュリティ上、成功・失敗に関わらず同じメッセージを返す
    return NextResponse.json(
      { message: "パスワードリセットメールを送信しました" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ パスワードリセットエラー:", error);

    // ユーザーが存在しない場合でもセキュリティ上、成功メッセージを返す
    return NextResponse.json(
      { message: "パスワードリセットメールを送信しました" },
      { status: 200 }
    );
  }
};
