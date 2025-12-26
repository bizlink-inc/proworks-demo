import { NextRequest, NextResponse } from "next/server";

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

    // Better Auth の forget-password エンドポイントを直接呼び出し
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${appUrl}/api/auth/forget-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        redirectTo: `${appUrl}/auth/reset-password`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ パスワードリセットAPIエラー:", errorData);
    } else {
      console.log("✅ パスワードリセットメール送信完了:", email);
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
