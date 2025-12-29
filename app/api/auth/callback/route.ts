import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getTalentByAuthUserId, createTalent } from "@/lib/kintone/services/talent";
import { sendNewUserNotification } from "@/lib/slack";

export const GET = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id || !session?.user?.email) {
      console.log("⚠️ セッションが見つかりません");
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }

    console.log("✅ メール認証後のコールバック:", session.user.email);

    // サインアップ時に保存したデータをクッキーから取得
    const signupDataCookie = request.cookies.get("pw_signup_data")?.value;
    let signupData = {
      lastName: "",
      firstName: "",
      phone: "",
      birthDate: "",
      emailDeliveryStatus: "",
      termsAgreed: "",
    };

    if (signupDataCookie) {
      try {
        signupData = JSON.parse(signupDataCookie);
        console.log("📋 サインアップデータをクッキーから復元:", signupData);
      } catch (e) {
        console.warn("⚠️ サインアップデータの解析に失敗:", e);
      }
    }

    // クッキーから取得できない場合、セッションのカスタムフィールドから取得
    const userWithFields = session.user as any;

    if (!signupData.lastName && userWithFields.lastName) {
      signupData.lastName = userWithFields.lastName;
      console.log("📋 セッションから姓を取得:", signupData.lastName);
    }
    if (!signupData.firstName && userWithFields.firstName) {
      signupData.firstName = userWithFields.firstName;
      console.log("📋 セッションから名を取得:", signupData.firstName);
    }
    if (!signupData.phone && userWithFields.phone) {
      signupData.phone = userWithFields.phone;
      console.log("📋 セッションから電話番号を取得:", signupData.phone);
    }
    if (!signupData.birthDate && userWithFields.birthDate) {
      signupData.birthDate = userWithFields.birthDate;
      console.log("📋 セッションから生年月日を取得:", signupData.birthDate);
    }

    // フォールバック: session.user.nameから姓名を分割
    if (!signupData.lastName && !signupData.firstName && session.user.name) {
      const nameParts = session.user.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        signupData.lastName = nameParts[0];
        signupData.firstName = nameParts.slice(1).join(" ");
      } else if (nameParts.length === 1) {
        signupData.firstName = nameParts[0];
      }
      console.log("📋 session.user.nameから姓名を分割:", signupData.lastName, signupData.firstName);
    }

    // kintoneに人材レコードが既に存在するかチェック
    const existingTalent = await getTalentByAuthUserId(session.user.id);

    if (!existingTalent) {
      // kintoneに人材情報を作成（サインアップ時のデータを含む）
      try {
        const recordId = await createTalent({
          authUserId: session.user.id,
          lastName: signupData.lastName,
          firstName: signupData.firstName,
          email: session.user.email,
          phone: signupData.phone,
          birthDate: signupData.birthDate,
          emailDeliveryStatus: signupData.emailDeliveryStatus,
          termsAgreed: signupData.termsAgreed,
        });
        console.log("✅ kintoneに人材レコード作成:", session.user.email, "(ID:", recordId, ")");
        console.log("   姓名:", signupData.lastName, signupData.firstName);

        // Slack通知をバックグラウンドで送信（Fire-and-forget）
        const fullName = `${signupData.lastName} ${signupData.firstName}`.trim() || session.user.email.split("@")[0];
        sendNewUserNotification({
          fullName,
          email: session.user.email,
          phone: signupData.phone || "",
          talentRecordId: recordId,
        }).catch((err) => console.error("⚠️ Slack通知送信失敗:", err));
      } catch (error) {
        console.warn("⚠️ kintone登録エラー（メール認証は成功）:", error);
      }
    } else {
      console.log("ℹ️ 既にkintoneレコードが存在します");
    }

    // プロフィール入力完了ページにリダイレクト
    const response = NextResponse.redirect(new URL("/auth/complete-profile", request.url));

    // サインアップデータのクッキーを削除
    response.cookies.delete("pw_signup_data");

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

