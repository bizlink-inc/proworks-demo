import { NextRequest, NextResponse } from "next/server";
import { getAllJobs } from "@/lib/kintone/services/job";

export const GET = async (request: NextRequest) => {
  try {
    // クエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const sort = searchParams.get("sort") || "new";

    // kintoneからすべての案件を取得
    let jobs = await getAllJobs();

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

    return NextResponse.json({
      items: jobs,
      total: jobs.length,
    });
  } catch (error) {
    console.error("案件一覧の取得に失敗:", error);
    return NextResponse.json(
      { error: "案件一覧の取得に失敗しました" },
      { status: 500 }
    );
}
};
