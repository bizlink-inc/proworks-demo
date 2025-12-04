import { NextRequest, NextResponse } from "next/server";
import { auth, generateRandomPassword } from "@/lib/auth";
import { headers } from "next/headers";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { email, rememberMe } = body;

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスが必要です" },
        { status: 400 }
      );
    }

    // ランダムなパスワードを生成
    const randomPassword = generateRandomPassword();

    console.log("📝 サインアップ処理開始:", email);
    console.log("   自動生成パスワード:", randomPassword.substring(0, 8) + "...");
    console.log("   ログイン保持:", rememberMe ? "有効" : "無効");

    // Better Authでユーザー登録（メール認証付き）
    await auth.api.signUpEmail({
      body: {
        email,
        password: randomPassword,
        name: email.split("@")[0], // 一時的にメールアドレスの@前を名前とする
      },
      headers: await headers(),
    });

    console.log("✅ ユーザー登録成功（メール認証待ち）:", email);
    console.log("   メール認証リンクがコンソールに出力されます");

    // ログイン保持の設定をレスポンスに含める
    const response = NextResponse.json(
      { 
        message: "認証メールを送信しました",
        email,
        rememberMe,
      },
      { status: 200 }
    );

    // rememberMe が有効な場合、クッキーに情報を保存
    if (rememberMe) {
      response.cookies.set("pw_signup_remember", email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30日間
        path: "/",
      });
      console.log("🍪 ログイン保持クッキーを設定:", email);
    }

    return response;
  } catch (error: any) {
    console.error("❌ サインアップエラー:", error);

    // 重複メールアドレスのエラーハンドリング
    if (error.message?.includes("email") || error.message?.includes("unique") || error.message?.includes("already")) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています。" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "ユーザー登録に失敗しました。" },
      { status: 500 }
    );
  }
};

