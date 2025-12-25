import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getApplicationsByAuthUserId } from "@/lib/kintone/services/application";
import { getJobsByIds } from "@/lib/kintone/services/job";

export const GET = async () => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // kintoneから応募履歴を取得（auth_user_idで検索、3ヶ月以内、応募取消し除外済み）
    const applications = await getApplicationsByAuthUserId(session.user.id);

    // 案件情報を一括取得（N+1問題解消）
    const jobIds = applications.map(app => app.jobId);
    const jobMap = await getJobsByIds(jobIds);

    // 各応募に案件情報を紐付け
    const applicationsWithJobs = applications.map((app) => ({
      ...app,
      job: jobMap.get(app.jobId) || null,
    }));

    return NextResponse.json(applicationsWithJobs);
  } catch (error) {
    console.error("応募履歴の取得に失敗:", error);
    return NextResponse.json(
      { error: "応募履歴の取得に失敗しました" },
      { status: 500 }
    );
}
};
