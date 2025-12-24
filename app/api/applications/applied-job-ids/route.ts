import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getApplicationsByAuthUserId } from "@/lib/kintone/services/application";

/**
 * 応募済み案件IDの一覧を取得（軽量版）
 * GET /api/applications/applied-job-ids
 *
 * 案件詳細は取得せず、jobIdのみを返すことで高速化
 */
export const GET = async () => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // kintoneから応募履歴を取得
    const applications = await getApplicationsByAuthUserId(session.user.id);

    // 応募取消しのレコードを除外し、jobIdのみを抽出
    const appliedJobIds = applications
      .filter((app) => app.status !== "応募取消し")
      .map((app) => app.jobId);

    return NextResponse.json({ appliedJobIds });
  } catch (error) {
    console.error("応募済み案件IDの取得に失敗:", error);
    return NextResponse.json(
      { error: "応募済み案件IDの取得に失敗しました" },
      { status: 500 }
    );
  }
};
