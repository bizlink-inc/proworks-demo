import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getAllJobs } from "@/lib/kintone/services/job";
import { getApplicationsByAuthUserId } from "@/lib/kintone/services/application";
import { createRecommendationClient, getAppIds } from "@/lib/kintone/client";
import { RECOMMENDATION_FIELDS } from "@/lib/kintone/fieldMapping";
import type { RecommendationRecord } from "@/lib/kintone/types";

/**
 * おすすめ案件を取得するAPI
 * 優先順位: 1. 担当者おすすめ、2. AIマッチ、3. New
 */
export const GET = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = session.user.id;

    // 応募済み案件を取得（除外用）
    const applications = await getApplicationsByAuthUserId(authUserId);
    const appliedJobIds = new Set(applications.map((app) => app.jobId));

    // すべての案件を取得
    let jobs = await getAllJobs();

    // 応募済み案件を除外
    jobs = jobs.filter((job) => !appliedJobIds.has(job.id));

    // 募集ステータスが「クローズ」の案件を除外（案件一覧には表示しない）
    jobs = jobs.filter((job) => job.recruitmentStatus !== 'クローズ');

    // 推薦DBからユーザーの推薦データを取得（担当者おすすめとAIマッチ情報を含む）
    const recommendationClient = createRecommendationClient();
    const appIds = getAppIds();

    if (!appIds.recommendation) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const recommendations = await recommendationClient.record.getAllRecords({
      app: appIds.recommendation,
      condition: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${authUserId}"`,
      fields: [
        RECOMMENDATION_FIELDS.JOB_ID,
        RECOMMENDATION_FIELDS.SCORE,
        RECOMMENDATION_FIELDS.STAFF_RECOMMEND,
        RECOMMENDATION_FIELDS.AI_EXECUTION_STATUS,
        RECOMMENDATION_FIELDS.AI_OVERALL_SCORE,
      ],
    }) as RecommendationRecord[];

    // 推薦データをマップ化（案件IDをキーに）
    const recommendationMap = new Map<string, {
      staffRecommend: boolean;
      aiMatched: boolean;
      score: number;
    }>();

    for (const rec of recommendations) {
      const jobId = rec[RECOMMENDATION_FIELDS.JOB_ID].value;
      const staffRecommend = rec[RECOMMENDATION_FIELDS.STAFF_RECOMMEND]?.value === "おすすめ";
      const aiExecutionStatus = rec[RECOMMENDATION_FIELDS.AI_EXECUTION_STATUS]?.value || "";
      const aiMatched = aiExecutionStatus === "実行済み";
      const score = parseInt(rec[RECOMMENDATION_FIELDS.SCORE].value, 10) || 0;

      recommendationMap.set(jobId, {
        staffRecommend,
        aiMatched,
        score,
      });
    }

    // 案件に推薦情報を追加
    const jobsWithRecommendation = jobs.map((job) => {
      const rec = recommendationMap.get(job.id);
      return {
        ...job,
        staffRecommend: rec?.staffRecommend || false,
        aiMatched: rec?.aiMatched || false,
        recommendationScore: rec?.score || 0,
      };
    });

    // 優先順位でソート
    // 1. 担当者おすすめ
    // 2. AIマッチ
    // 3. New（新着フラグ）
    // 4. その他（推薦スコア順）
    const sortedJobs = jobsWithRecommendation.sort((a, b) => {
      // 優先順位1: 担当者おすすめ
      if (a.staffRecommend && !b.staffRecommend) return -1;
      if (!a.staffRecommend && b.staffRecommend) return 1;

      // 優先順位2: AIマッチ
      if (a.aiMatched && !b.aiMatched) return -1;
      if (!a.aiMatched && b.aiMatched) return 1;

      // 優先順位3: New（新着フラグ）
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;

      // 優先順位4: 推薦スコア順
      const scoreA = a.recommendationScore || 0;
      const scoreB = b.recommendationScore || 0;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // スコアが同じ場合は新着順
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      items: sortedJobs,
      total: sortedJobs.length,
    });
  } catch (error) {
    console.error("おすすめ案件の取得に失敗:", error);
    return NextResponse.json(
      { error: "おすすめ案件の取得に失敗しました" },
      { status: 500 }
    );
  }
};



