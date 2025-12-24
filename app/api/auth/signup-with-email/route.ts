import { NextRequest, NextResponse } from "next/server";
import { auth, generateRandomPassword } from "@/lib/auth";
import { headers } from "next/headers";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { 
      email, 
      password,
      lastName, 
      firstName, 
      phone, 
      birthDate,
      emailDeliveryStatus,
      termsAgreed,
      rememberMe 
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスが必要です" },
        { status: 400 }
      );
    }

    // パスワードが指定されていない場合はランダム生成
    const userPassword = password || generateRandomPassword();

    console.log("📝 サインアップ処理開始:", email);
    console.log("   姓名:", lastName, firstName);
    console.log("   ログイン保持:", rememberMe ? "有効" : "無効");

    // Better Authでユーザー登録（メール認証付き）
    // カスタムフィールド（lastName, firstName, phone, birthDate）も一緒に保存
    await auth.api.signUpEmail({
      body: {
        email,
        password: userPassword,
        name: `${lastName} ${firstName}`.trim() || email.split("@")[0],
        lastName: lastName || "",
        firstName: firstName || "",
        phone: phone || "",
        birthDate: birthDate || "",
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

    // サインアップ時の情報をクッキーに保存（メール認証後にkintoneに登録するため）
    const signupData = JSON.stringify({
      lastName: lastName || "",
      firstName: firstName || "",
      phone: phone || "",
      birthDate: birthDate || "",
      emailDeliveryStatus: emailDeliveryStatus || "",
      termsAgreed: termsAgreed || "",
    });
    
    response.cookies.set("pw_signup_data", signupData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1時間（メール認証の有効期限内）
      path: "/",
    });
    console.log("🍪 サインアップデータをクッキーに保存");

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
    console.error("   エラーメッセージ:", error.message);
    console.error("   エラー詳細:", JSON.stringify(error, null, 2));

    // 重複メールアドレスのエラーハンドリング（より厳密に判定）
    const errorMsg = error.message?.toLowerCase() || "";
    if (
      errorMsg.includes("already exists") ||
      errorMsg.includes("duplicate") ||
      errorMsg.includes("unique constraint") ||
      (errorMsg.includes("email") && errorMsg.includes("registered"))
    ) {
      return NextResponse.json(
        { error: "このメールアドレスは既に登録されています。" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "ユーザー登録に失敗しました。" },
      { status: 500 }
    );
  }
};

