import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getAppliedJobIdsByAuthUserId } from "@/lib/kintone/services/application";

/**
 * 応募済み案件IDの一覧を取得（軽量版）
 * GET /api/applications/applied-job-ids
 *
 * 案件詳細は取得せず、jobIdのみを返すことで高速化
 * 3ヶ月制限なし（checkDuplicateApplicationと同じ条件）
 */
export const GET = async () => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 応募済み案件IDを取得（3ヶ月制限なし）
    const appliedJobIds = await getAppliedJobIdsByAuthUserId(session.user.id);

    return NextResponse.json({ appliedJobIds });
  } catch (error) {
    console.error("応募済み案件IDの取得に失敗:", error);
    return NextResponse.json(
      { error: "応募済み案件IDの取得に失敗しました" },
      { status: 500 }
    );
  }
};
