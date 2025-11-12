import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "現在のパスワードと新しいパスワードが必要です" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "新しいパスワードは6文字以上である必要があります" },
        { status: 400 }
      );
    }

    // Better Authの標準APIを使用してパスワードを変更
    const result = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
      },
      headers: await headers(),
    });

    if (!result) {
      return NextResponse.json(
        { error: "パスワード変更に失敗しました" },
        { status: 500 }
      );
    }

    console.log("✅ パスワード変更成功");

    return NextResponse.json(
      { message: "パスワードが変更されました" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("パスワード変更エラー:", error);
    
    // Better Authのエラーメッセージを取得
    const errorMessage = error?.message || "パスワード変更に失敗しました";
    
    // エラーメッセージを日本語に変換
    let japaneseMessage = errorMessage;
    if (errorMessage.includes("Invalid password") || errorMessage.includes("incorrect password")) {
      japaneseMessage = "現在のパスワードが正しくありません";
    } else if (errorMessage.includes("password")) {
      japaneseMessage = "パスワード変更に失敗しました";
    }

    return NextResponse.json(
      { error: japaneseMessage },
      { status: 400 }
    );
  }
};

