import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getApplicationsByAuthUserId } from "@/lib/kintone/services/application";
import { getTalentByAuthUserId } from "@/lib/kintone/services/talent";
import { getJobsByIds } from "@/lib/kintone/services/job";

/**
 * バックグラウンドでデータを先読みするAPI
 * キャッシュを温めることで、ページ遷移時のレスポンスを高速化
 *
 * GET /api/prefetch
 */
export const GET = async () => {
  const startTime = Date.now();

  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 並列でデータを先読み（キャッシュに保存される）
    const [applications, talent] = await Promise.all([
      // 応募履歴を先読み → キャッシュに保存
      getApplicationsByAuthUserId(userId).catch((e) => {
        console.error("[Prefetch] 応募履歴の先読み失敗:", e);
        return [];
      }),
      // タレント情報を先読み
      getTalentByAuthUserId(userId).catch((e) => {
        console.error("[Prefetch] タレント情報の先読み失敗:", e);
        return null;
      }),
    ]);

    // 応募案件のジョブ情報も先読み
    if (applications.length > 0) {
      const jobIds = applications.map((app) => app.jobId);
      await getJobsByIds(jobIds).catch((e) => {
        console.error("[Prefetch] 案件情報の先読み失敗:", e);
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[Prefetch] 先読み完了: ${duration}ms, applications=${applications.length}`);

    return NextResponse.json({
      success: true,
      prefetched: {
        applications: applications.length,
        talent: !!talent,
      },
      duration,
    });
  } catch (error) {
    console.error("[Prefetch] エラー:", error);
    return NextResponse.json(
      { error: "Prefetch failed" },
      { status: 500 }
    );
  }
};
