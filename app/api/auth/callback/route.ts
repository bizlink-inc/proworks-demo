import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getTalentByAuthUserId, createTalent } from "@/lib/kintone/services/talent";

export const GET = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id || !session?.user?.email) {
      console.log("⚠️ セッションが見つかりません");
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    console.log("✅ メール認証後のコールバック:", session.user.email);

    // kintoneに人材レコードが既に存在するかチェック
    const existingTalent = await getTalentByAuthUserId(session.user.id);

    if (!existingTalent) {
      // kintoneに最小限の人材情報を作成（メールアドレスのみ）
      try {
        await createTalent({
          authUserId: session.user.id,
          lastName: "",
          firstName: "",
          email: session.user.email,
          phone: "",
          birthDate: "",
        });
        console.log("✅ kintoneに人材レコード作成（最小限）:", session.user.email);
      } catch (error) {
        console.warn("⚠️ kintone登録エラー（メール認証は成功）:", error);
      }
    } else {
      console.log("ℹ️ 既にkintoneレコードが存在します");
    }

    // プロフィール入力完了ページにリダイレクト
    const response = NextResponse.redirect(new URL("/auth/complete-profile", request.url));

    // rememberMe クッキーから ログイン保持フラグを確認
    const rememberMeEmail = request.cookies.get("pw_signup_remember")?.value;
    const rememberMe = rememberMeEmail === session.user.email;

    if (rememberMe) {
      console.log("🔐 ログイン保持が有効です。セッション有効期限を拡張");
      // ログイン保持が有効な場合のログをここに記録
      // セッション自体の有効期限はBetter Authが管理するため、
      // ここではクッキーの設定を行う
      response.cookies.set("pw_extended_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30日間
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("❌ コールバックエラー:", error);
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }
};

