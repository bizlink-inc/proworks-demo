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

    // 各応募に対して案件情報を取得
    const applicationsWithJobs = await Promise.all(
      applications.map(async (app) => {
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
