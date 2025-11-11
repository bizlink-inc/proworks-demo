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

    // 開発環境ではコンソールにリセットリンクを出力
    if (process.env.NODE_ENV === "development") {
      // パスワードリセットトークンを生成（簡易版）
      const resetToken = Buffer.from(`${email}:${Date.now()}`).toString("base64");
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

      console.log("\n" + "=".repeat(80));
      console.log("🔑 パスワードリセットリンク");
      console.log("=".repeat(80));
      console.log(`宛先: ${email}`);
      console.log(`リンク: ${resetUrl}`);
      console.log("=".repeat(80) + "\n");
    }

    // 本番環境ではResendを使用（後で実装）
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: "noreply@yourapp.com",
    //   to: email,
    //   subject: "パスワードリセット",
    //   html: `...`,
    // });

    return NextResponse.json(
      { message: "パスワードリセットメールを送信しました" },
      { status: 200 }
    );
  } catch (error) {
    console.error("パスワードリセットエラー:", error);
    return NextResponse.json(
      { error: "パスワードリセットメールの送信に失敗しました" },
      { status: 500 }
    );
  }
};

