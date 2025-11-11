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
    return NextResponse.redirect(new URL("/auth/complete-profile", request.url));
  } catch (error) {
    console.error("❌ コールバックエラー:", error);
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }
};

