import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendPasswordChangedNotificationEmail } from "@/lib/email";

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

    const reqHeaders = await headers();

    // セッションからユーザー情報を取得
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "ログインが必要です" },
        { status: 401 }
      );
    }

    // Better Authの標準APIを使用してパスワードを変更
    const result = await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
      },
      headers: reqHeaders,
    });

    if (!result) {
      return NextResponse.json(
        { error: "パスワード変更に失敗しました" },
        { status: 500 }
      );
    }

    console.log("✅ パスワード変更成功");

    // パスワード変更完了通知メールを送信（失敗してもパスワード変更自体は成功扱い）
    try {
      const userName = session.user.name || "ユーザー";
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://proworks.jp";
      await sendPasswordChangedNotificationEmail(session.user.email, userName, baseUrl);
      console.log("✅ パスワード変更通知メール送信成功");
    } catch (emailError) {
      console.error("⚠️ パスワード変更通知メール送信失敗:", emailError);
    }

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

