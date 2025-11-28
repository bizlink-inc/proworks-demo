import { NextRequest, NextResponse } from "next/server";
import { auth, generateRandomPassword } from "@/lib/auth";
import { headers } from "next/headers";

// 新規登録時のリクエストボディの型
type SignupRequestBody = {
  email: string;
  lastName?: string;
  firstName?: string;
  phone?: string;
  birthDate?: string;
  emailDeliveryStatus?: string;
  termsAgreed?: string;
};

export const POST = async (request: NextRequest) => {
  try {
    const body: SignupRequestBody = await request.json();
    const { 
      email, 
      lastName, 
      firstName, 
      phone, 
      birthDate,
      emailDeliveryStatus,
      termsAgreed,
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスが必要です" },
        { status: 400 }
      );
    }

    // ランダムなパスワードを生成
    const randomPassword = generateRandomPassword();

    // 名前の生成（姓名がある場合は結合、なければメールアドレスの@前を使用）
    const name = lastName && firstName 
      ? `${lastName} ${firstName}` 
      : email.split("@")[0];

    console.log("📝 サインアップ処理開始:", email);
    console.log("   自動生成パスワード:", randomPassword.substring(0, 8) + "...");
    console.log("   追加情報:", { lastName, firstName, phone, birthDate, emailDeliveryStatus, termsAgreed });

    // Better Authでユーザー登録（メール認証付き）
    // 追加情報はセッションストレージまたはデータベースに一時保存して、
    // メール認証完了後にkintoneに登録する
    await auth.api.signUpEmail({
      body: {
        email,
        password: randomPassword,
        name,
        // Better Authのカスタムフィールドとして追加情報を保存
        // これらはメール認証後のコールバックで使用される
      },
      headers: await headers(),
    });

    console.log("✅ ユーザー登録成功（メール認証待ち）:", email);
    console.log("   メール認証リンクがコンソールに出力されます");

    return NextResponse.json(
      { 
        message: "認証メールを送信しました",
        email,
        // 追加情報を返す（フロントエンドで必要に応じて使用）
        additionalInfo: {
          lastName,
          firstName,
          phone,
          birthDate,
          emailDeliveryStatus,
          termsAgreed,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ サインアップエラー:", error);

    // 重複メールアドレスのエラーハンドリング
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes("email") || errorMessage.includes("unique") || errorMessage.includes("already")) {
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

