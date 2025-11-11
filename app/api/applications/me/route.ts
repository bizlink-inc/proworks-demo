import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getTalentByAuthUserId } from "@/lib/kintone/services/talent";
import { getApplicationsByTalentName } from "@/lib/kintone/services/application";
import { getJobByTitle } from "@/lib/kintone/services/job";

export const GET = async () => {
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

    // kintoneから応募履歴を取得
    const applications = await getApplicationsByTalentName(talent.fullName);

    // 各応募に対して案件情報を取得
    const applicationsWithJobs = await Promise.all(
      applications.map(async (app) => {
        const job = await getJobByTitle(app.jobTitle);
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
