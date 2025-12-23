import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getTalentByAuthUserId } from "@/lib/kintone/services/talent";
import { createInquiry } from "@/lib/kintone/services/inquiry";
import { sendContactConfirmationEmail } from "@/lib/email";

export const POST = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // kintoneから人材情報を取得（メール送信用）
    const talent = await getTalentByAuthUserId(session.user.id);

    if (!talent) {
      return NextResponse.json({ error: "Talent not found" }, { status: 404 });
    }

    const body = await request.json();
    const { category, content } = body;

    if (!category || !content) {
      return NextResponse.json(
        { error: "カテゴリと内容は必須です" },
        { status: 400 }
      );
    }

    // kintoneに問い合わせを登録（ルックアップでユーザーIDから氏名を自動取得）
    const recordId = await createInquiry({
      category: "問い合わせ",
      userId: session.user.id,
      inquiryCategory: category,
      inquiryContent: content,
    });

    // 確認メールを送信
    const emailResult = await sendContactConfirmationEmail(
      talent.email,
      talent.fullName || `${talent.lastName} ${talent.firstName}`,
      content
    );

    if (!emailResult.success) {
      console.error("確認メール送信に失敗:", emailResult.error);
      // メール送信失敗でもお問い合わせ自体は成功とする
    }

    return NextResponse.json({
      success: true,
      recordId,
      message: "お問い合わせを受け付けました",
    });
  } catch (error) {
    console.error("お問い合わせの登録に失敗:", error);
    return NextResponse.json(
      { error: "お問い合わせの登録に失敗しました" },
      { status: 500 }
    );
  }
};
