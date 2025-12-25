import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getJobById } from "@/lib/kintone/services/job";
import { createApplication, checkDuplicateApplication } from "@/lib/kintone/services/application";
import { sendApplicationCompleteEmail } from "@/lib/email";
import { getTalentByAuthUserId } from "@/lib/kintone/services/talent";
import { checkRequiredFields } from "@/lib/utils/profile-validation";

export const POST = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId } = body;

    // 1. 並列でジョブ取得と重複チェック（パフォーマンス改善）
    const [job, isDuplicate] = await Promise.all([
      getJobById(jobId),
      checkDuplicateApplication(session.user.id, jobId),
    ]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (isDuplicate) {
      return NextResponse.json({ error: "Already applied" }, { status: 409 });
    }

    // 2. kintoneに応募を作成
    const applicationId = await createApplication({
      authUserId: session.user.id,
      jobId,
    });

    // 3. ユーザー情報を取得（missingFields計算 + メール送信用）
    const talent = await getTalentByAuthUserId(session.user.id);

    // 4. 必須項目の未入力チェック
    const missingFields = checkRequiredFields(talent);

    // 5. レスポンスデータを準備（missingFieldsを含む）
    const responseData = {
      id: applicationId,
      jobTitle: job.title,
      appliedAt: new Date().toISOString(),
      missingFields: missingFields.length > 0 ? missingFields : undefined,
    };

    // 6. メール送信をバックグラウンドで実行（Fire-and-forget）
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://proworks.jp";
    const userEmail = session.user.email!;

    // ユーザー名を決定（既に取得したtalent情報を使用）
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

    // メール送信は非同期で実行（レスポンスを待たない）
    sendApplicationCompleteEmail(userEmail, userName, baseUrl)
      .then(() => console.log("✅ 応募完了メール送信成功"))
      .catch((emailError) => console.error("⚠️ 応募完了メール送信失敗:", emailError));

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("応募の作成に失敗:", error);
    return NextResponse.json(
      { error: "応募の作成に失敗しました" },
      { status: 500 }
    );
  }
};
