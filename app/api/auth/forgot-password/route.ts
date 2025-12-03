import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Vercel 環境では機能しない
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

export const POST = async (request: NextRequest) => {
  // Vercel 環境では機能しないことを返す
  if (isVercel) {
    return NextResponse.json(
      { error: "この機能はデモ環境では利用できません" },
      { status: 503 }
    );
  }

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

    // Better Auth の forgetPassword API を呼び出し
    // これにより lib/auth.ts の sendResetPassword が呼び出される
    await auth.api.forgetPassword({
      body: {
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      },
      headers: await headers(),
    });

    console.log("✅ パスワードリセットメール送信完了:", email);

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
