import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getApplicationsByAuthUserId } from "@/lib/kintone/services/application";
import { getJobById } from "@/lib/kintone/services/job";

export const GET = async () => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // kintoneから応募履歴を取得（auth_user_idで検索）
    const applications = await getApplicationsByAuthUserId(session.user.id);

    // 応募取消しのレコードを除外
    const activeApplications = applications.filter((app) => app.status !== "応募取消し");

    // 3ヶ月以上前の応募履歴を除外
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentApplications = activeApplications.filter((app) => {
      if (!app.appliedAt) return false;
      const appliedDate = new Date(app.appliedAt);
      return appliedDate >= threeMonthsAgo;
    });

    // 各応募に対して案件情報を取得
    const applicationsWithJobs = await Promise.all(
      recentApplications.map(async (app) => {
        const job = await getJobById(app.jobId);
        return {
          ...app,
          job: job || null,
        };
      })
    );

    return NextResponse.json(applicationsWithJobs);
  } catch (error) {
    console.error("応募履歴の取得に失敗:", error);
    return NextResponse.json(
      { error: "応募履歴の取得に失敗しました" },
      { status: 500 }
    );
}
};
