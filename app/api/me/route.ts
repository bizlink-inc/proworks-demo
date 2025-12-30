import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getTalentByAuthUserId, updateTalent, markProfileCompleteNotified } from "@/lib/kintone/services/talent";
import { checkRequiredFields } from "@/lib/utils/profile-validation";
import { sendProfileCompleteNotification } from "@/lib/slack";

export const GET = async () => {
  try {
    const session = await getSession();
    console.log("Session:", session);

    if (!session?.user?.id) {
      console.log("Unauthorized: No session or user id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching talent for auth_user_id:", session.user.id);

    // kintoneから人材情報を取得
    const talent = await getTalentByAuthUserId(session.user.id);
    console.log("Talent data:", talent);

    if (!talent) {
      console.log("Talent not found for user:", session.user.id);
      return NextResponse.json({ error: "Talent not found" }, { status: 404 });
    }

    // 退会済みユーザーのチェック
    if (talent.st === "退会") {
      console.log("Withdrawn user attempted to access:", session.user.id);
      return NextResponse.json(
        { error: "このアカウントは退会済みです", withdrawn: true },
        { status: 403 }
      );
    }

    return NextResponse.json(talent);
  } catch (error) {
    console.error("人材情報の取得に失敗:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "人材情報の取得に失敗しました" },
      { status: 500 }
    );
}
};

export const PATCH = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // kintoneから人材情報を取得（1回のみ）
    const talent = await getTalentByAuthUserId(session.user.id);

    if (!talent) {
      return NextResponse.json({ error: "Talent not found" }, { status: 404 });
    }

    const body = await request.json();

    // kintoneの人材情報を更新
    await updateTalent(talent.id, body);

    // 更新後は入力データをマージして返す（再取得不要）
    // クライアントが送信したデータは正常に保存されたと信頼する
    const updatedTalent = { ...talent, ...body };

    // 更新後のプロフィール完了状態をチェック
    const missingFieldsAfter = checkRequiredFields(updatedTalent);
    const isNowComplete = missingFieldsAfter.length === 0;
    const alreadyNotified = !!talent.profileCompleteNotifiedAt;
    console.log("[Profile Check] 更新後の未入力項目:", missingFieldsAfter);
    console.log("[Profile Check] isNowComplete:", isNowComplete, "alreadyNotified:", alreadyNotified);

    // プロフィールが完了かつ未通知の場合、Slack通知を送信
    if (isNowComplete && !alreadyNotified) {
      console.log("[Profile Check] プロフィール完成！Slack通知を送信します");
      console.log("[Profile Check] talent.id:", talent.id);
      const fullName = `${talent.lastName || ""} ${talent.firstName || ""}`.trim();
      try {
        await sendProfileCompleteNotification({
          fullName: fullName || session.user.email!.split("@")[0],
          email: session.user.email!,
          talentRecordId: talent.id,
        });
        // 通知成功時にKintoneに通知日時を記録
        await markProfileCompleteNotified(talent.id);
        console.log("[Profile Check] 通知日時をKintoneに記録しました");
      } catch (err) {
        console.error("⚠️ Slack通知送信失敗:", err);
      }
    }

    return NextResponse.json(updatedTalent);
  } catch (error) {
    console.error("人材情報の更新に失敗:", error);
    return NextResponse.json(
      { error: "人材情報の更新に失敗しました" },
      { status: 500 }
    );
  }
};
