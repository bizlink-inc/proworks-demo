import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getJobById } from "@/lib/kintone/services/job";
import { createApplication, checkDuplicateApplication } from "@/lib/kintone/services/application";
import { sendApplicationCompleteEmail } from "@/lib/email";
import { getTalentByAuthUserId } from "@/lib/kintone/services/talent";

export const POST = async (request: NextRequest) => {
  try {
    const session = await getSession();

  if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

    const body = await request.json();
    const { jobId } = body;

    // kintoneから案件情報を取得
    const job = await getJobById(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 重複チェック（auth_user_idと案件IDで）
    const isDuplicate = await checkDuplicateApplication(session.user.id, jobId);

    if (isDuplicate) {
      return NextResponse.json({ error: "Already applied" }, { status: 409 });
  }

    // kintoneに応募を作成
    const applicationId = await createApplication({
      authUserId: session.user.id,
    jobId,
    });

    // 応募完了メール送信
    try {
      const talent = await getTalentByAuthUserId(session.user.id);
      let userName: string;

      if (talent?.lastName && talent?.firstName) {
        userName = `${talent.lastName} ${talent.firstName}`;
      } else if (talent?.fullName && talent.fullName.trim()) {
        userName = talent.fullName;
      } else if (session.user.name && session.user.name.trim()) {
        userName = session.user.name;
      } else {
        userName = "会員";
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://proworks.jp";
      await sendApplicationCompleteEmail(session.user.email!, userName, baseUrl);
      console.log("✅ 応募完了メール送信成功");
    } catch (emailError) {
      // メール送信失敗しても応募自体は成功扱い
      console.error("⚠️ 応募完了メール送信失敗:", emailError);
    }

    return NextResponse.json(
      {
        id: applicationId,
        jobTitle: job.title,
    appliedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("応募の作成に失敗:", error);
    return NextResponse.json(
      { error: "応募の作成に失敗しました" },
      { status: 500 }
    );
}
};
