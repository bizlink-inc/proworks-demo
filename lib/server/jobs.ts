/**
 * サーバーサイド用の案件データ取得関数
 * APIルートを経由せず直接Kintoneからデータを取得することで、
 * HTTPラウンドトリップのオーバーヘッドを削減
 */

import { getAllJobs } from "@/lib/kintone/services/job";
import { getApplicationsByAuthUserId } from "@/lib/kintone/services/application";
import { createRecommendationClient, getAppIds } from "@/lib/kintone/client";
import { RECOMMENDATION_FIELDS } from "@/lib/kintone/fieldMapping";
import type { Job, RecommendationRecord } from "@/lib/kintone/types";

export type JobWithMetadata = Job & {
  recommendationScore: number;
  staffRecommend: boolean;
  aiMatched: boolean;
  applicationStatus: string | null;
};

export interface PaginationOptions {
  skip?: number;
  limit?: number;
}

/**
 * 案件一覧を推薦情報付きで取得（サーバーサイド用）
 * デフォルトはおすすめ順でソート
 * @param authUserId - 認証ユーザーID
 * @param options - ページネーションオプション（skip: 開始位置, limit: 取得件数）
 */
export async function getJobsWithRecommendations(
  authUserId?: string,
  options?: PaginationOptions
): Promise<{ items: JobWithMetadata[]; total: number }> {
  // 全案件を取得（キャッシュ活用）
  let jobs = await getAllJobs();

  // 募集ステータスが「クローズ」の案件を除外
  jobs = jobs.filter((job) => job.recruitmentStatus !== "クローズ");

  let applicationsMap: Record<string, string> = {};
  let recommendationMap: Record<
    string,
    { score: number; staffRecommend: boolean; aiMatched: boolean }
  > = {};

  // ログインしている場合、応募ステータスと推薦情報を取得
  if (authUserId) {
    // 応募済み案件を取得
    const applications = await getApplicationsByAuthUserId(authUserId);

    applicationsMap = applications.reduce(
      (acc, app) => {
        acc[app.jobId] = app.status;
        return acc;
      },
      {} as Record<string, string>
    );

    // 推薦情報を取得
    const recommendationClient = createRecommendationClient();
    const appIds = getAppIds();

    if (appIds.recommendation) {
      const recommendationsResponse = await recommendationClient.record.getRecords({
        app: appIds.recommendation,
        query: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${authUserId}" limit 500`,
        fields: [
          RECOMMENDATION_FIELDS.JOB_ID,
          RECOMMENDATION_FIELDS.SCORE,
          RECOMMENDATION_FIELDS.STAFF_RECOMMEND,
        ],
      });
      const recommendations = recommendationsResponse.records as unknown as RecommendationRecord[];

      for (const rec of recommendations) {
        const jobId = rec[RECOMMENDATION_FIELDS.JOB_ID].value;
        const score = parseInt(rec[RECOMMENDATION_FIELDS.SCORE].value, 10) || 0;
        const staffRecommendValue = rec[RECOMMENDATION_FIELDS.STAFF_RECOMMEND]?.value;
        const staffRecommend = staffRecommendValue === "おすすめ";

        recommendationMap[jobId] = {
          score,
          staffRecommend,
          aiMatched: true, // 推薦DBにあればAIマッチ
        };
      }
    }
  }

  // 応募済み案件を除外
  jobs = jobs.filter((job) => !applicationsMap[job.id]);

  // 案件に推薦情報を追加
  const jobsWithMetadata: JobWithMetadata[] = jobs.map((job) => {
    const recommendation = recommendationMap[job.id];
    return {
      ...job,
      recommendationScore: recommendation?.score || 0,
      staffRecommend: recommendation?.staffRecommend || false,
      aiMatched: recommendation?.aiMatched || false,
      applicationStatus: applicationsMap[job.id] || null,
    };
  });

  // おすすめ順でソート（デフォルト）
  const sortedJobs = jobsWithMetadata.sort((a, b) => {
    // 優先順位1: 担当者おすすめ
    if (a.staffRecommend && !b.staffRecommend) return -1;
    if (!a.staffRecommend && b.staffRecommend) return 1;

    // 優先順位2: AIマッチ
    if (a.aiMatched && !b.aiMatched) return -1;
    if (!a.aiMatched && b.aiMatched) return 1;

    // 優先順位3: 推薦スコアの降順
    if (b.recommendationScore !== a.recommendationScore) {
      return b.recommendationScore - a.recommendationScore;
    }

    // スコアが同じ場合は新着順
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  // ページネーション適用
  const total = sortedJobs.length;
  const skip = options?.skip ?? 0;
  const limit = options?.limit ?? total; // デフォルトは全件
  const paginatedJobs = sortedJobs.slice(skip, skip + limit);

  return {
    items: paginatedJobs,
    total,
  };
}
