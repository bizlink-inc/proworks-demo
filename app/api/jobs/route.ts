import { NextRequest, NextResponse } from "next/server";
import { getAllJobs } from "@/lib/kintone/services/job";
import { getSession } from "@/lib/auth-server";
import { getApplicationsByAuthUserId } from "@/lib/kintone/services/application";

export const GET = async (request: NextRequest) => {
  try {
    // クエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const sort = searchParams.get("sort") || "new";
    const remoteParam = searchParams.get("remote") || "";
    const nearestStation = searchParams.get("nearestStation") || "";

    // リモートフィルターをパース（カンマ区切り）
    const remoteFilters = remoteParam ? remoteParam.split(",") : [];

    // kintoneからすべての案件を取得
    let jobs = await getAllJobs();

    // ログインしている場合、応募ステータスも取得
    let applicationsMap: Record<string, string> = {};
    try {
      const session = await getSession();
      if (session?.user?.id) {
        const applications = await getApplicationsByAuthUserId(session.user.id);
        applicationsMap = applications.reduce((acc, app) => {
          acc[app.jobId] = app.status;
          return acc;
        }, {} as Record<string, string>);
      }
    } catch (error) {
      // ログインしていない場合はスキップ
      console.log("User not logged in or error fetching applications");
    }

    // キーワード検索（案件名、作業内容、環境、必須スキル、尚可スキルを対象）
    if (query) {
      const lowerQuery = query.toLowerCase();
      jobs = jobs.filter((job) => {
        return (
          job.title?.toLowerCase().includes(lowerQuery) ||
          job.description?.toLowerCase().includes(lowerQuery) ||
          job.environment?.toLowerCase().includes(lowerQuery) ||
          job.requiredSkills?.toLowerCase().includes(lowerQuery) ||
          job.preferredSkills?.toLowerCase().includes(lowerQuery) ||
          job.features?.some(f => f.toLowerCase().includes(lowerQuery)) ||
          job.position?.some(p => p.toLowerCase().includes(lowerQuery))
        );
      });
    }

    // リモート可否フィルター
    if (remoteFilters.length > 0) {
      jobs = jobs.filter((job) => {
        // 案件のリモート値がフィルター条件のいずれかに一致するか
        return remoteFilters.includes(job.remote);
      });
    }

    // 最寄駅フィルター（"駅"を除いた部分一致検索）
    if (nearestStation) {
      // 入力から"駅"を除去
      const stationQuery = nearestStation.replace(/駅$/g, "").toLowerCase();
      jobs = jobs.filter((job) => {
        if (!job.nearestStation) return false;
        // 案件の最寄駅からも"駅"を除去して部分一致検索
        const jobStation = job.nearestStation.replace(/駅$/g, "").toLowerCase();
        return jobStation.includes(stationQuery);
      });
    }

    // ソート処理
    if (sort === "price") {
      // 単価が高い順（数値として比較）
      jobs = jobs.sort((a, b) => {
        const rateA = typeof a.rate === 'string' ? parseInt(a.rate, 10) : (a.rate || 0);
        const rateB = typeof b.rate === 'string' ? parseInt(b.rate, 10) : (b.rate || 0);
        return rateB - rateA;
      });
    }
    // 新着順はデフォルト（kintoneから取得した順序）

    // 案件に応募ステータスを追加
    const jobsWithStatus = jobs.map(job => ({
      ...job,
      applicationStatus: applicationsMap[job.id] || null
    }));

    return NextResponse.json({
      items: jobsWithStatus,
      total: jobsWithStatus.length,
    });
  } catch (error) {
    console.error("案件一覧の取得に失敗:", error);
    return NextResponse.json(
      { error: "案件一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
};
