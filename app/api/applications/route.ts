import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getJobById } from "@/lib/kintone/services/job";
import { createApplication, checkDuplicateApplication } from "@/lib/kintone/services/application";

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
