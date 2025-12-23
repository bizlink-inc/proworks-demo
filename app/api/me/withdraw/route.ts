import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getTalentByAuthUserId, updateTalent } from "@/lib/kintone/services/talent";
import { createInquiry, markWithdrawalCompleted } from "@/lib/kintone/services/inquiry";
import { sendWithdrawalCompletionEmail } from "@/lib/email";

export const POST = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // kintoneから人材情報を取得
    const talent = await getTalentByAuthUserId(session.user.id);

    if (!talent) {
      return NextResponse.json({ error: "Talent not found" }, { status: 404 });
    }

    const body = await request.json();
    const { reason, reasonDetail, confirmationAgreed } = body;

    if (!confirmationAgreed) {
      return NextResponse.json(
        { error: "確認事項への同意が必要です" },
        { status: 400 }
      );
    }

    // kintoneに退会申請を登録（ルックアップでユーザーIDから氏名を自動取得）
    const recordId = await createInquiry({
      category: "退会申請",
      userId: session.user.id,
      withdrawalReason: reason,
      withdrawalReasonDetail: reasonDetail,
      confirmationAgreed: true,
    });

    // 人材DBのSTフィールドを「退会」に更新
    try {
      await updateTalent(talent.id, { st: "退会" });
      console.log(`✅ 人材STを退会に更新しました: ID=${talent.id}`);
    } catch (updateError) {
      console.error("❌ 人材STの更新に失敗:", updateError);
      // 更新に失敗しても続行（管理者が手動で対応）
    }

    // 退会申請ステータスを完了に更新
    await markWithdrawalCompleted(recordId);

    // 退会完了メールを送信
    const emailResult = await sendWithdrawalCompletionEmail(
      talent.email,
      talent.fullName || `${talent.lastName} ${talent.firstName}`
    );

    if (!emailResult.success) {
      console.error("退会完了メール送信に失敗:", emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: "退会手続きが完了しました",
    });
  } catch (error) {
    console.error("退会処理に失敗:", error);
    return NextResponse.json(
      { error: "退会処理に失敗しました" },
      { status: 500 }
    );
  }
};
