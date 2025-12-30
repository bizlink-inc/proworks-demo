/**
 * サーバーサイド用の案件データ取得関数
 * APIルートを経由せず直接Kintoneからデータを取得することで、
 * HTTPラウンドトリップのオーバーヘッドを削減
 */

import { getAllJobs } from "@/lib/kintone/services/job";
import { getAppliedJobIdsByAuthUserId } from "@/lib/kintone/services/application";
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
 * ユーザーの推薦情報を取得するヘルパー関数
 */
async function getRecommendationsForUser(
  authUserId: string
): Promise<RecommendationRecord[]> {
  const recommendationClient = createRecommendationClient();
  const appIds = getAppIds();

  if (!appIds.recommendation) {
    return [];
  }

  try {
    const response = await recommendationClient.record.getRecords({
      app: appIds.recommendation,
      query: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${authUserId}" limit 500`,
      fields: [
        RECOMMENDATION_FIELDS.JOB_ID,
        RECOMMENDATION_FIELDS.SCORE,
        RECOMMENDATION_FIELDS.STAFF_RECOMMEND,
      ],
    });
    return response.records as unknown as RecommendationRecord[];
  } catch (error) {
    console.error("推薦情報の取得に失敗:", error);
    return [];
  }
}

/**
 * 推薦レコードからマップを構築するヘルパー関数
 */
function buildRecommendationMap(
  recommendations: RecommendationRecord[]
): Record<string, { score: number; staffRecommend: boolean; aiMatched: boolean }> {
  const map: Record<
    string,
    { score: number; staffRecommend: boolean; aiMatched: boolean }
  > = {};

  for (const rec of recommendations) {
    const jobId = rec[RECOMMENDATION_FIELDS.JOB_ID].value;
    const score = parseInt(rec[RECOMMENDATION_FIELDS.SCORE].value, 10) || 0;
    const staffRecommendValue = rec[RECOMMENDATION_FIELDS.STAFF_RECOMMEND]?.value;
    const staffRecommend = staffRecommendValue === "おすすめ";

    map[jobId] = {
      score,
      staffRecommend,
      aiMatched: true, // 推薦DBにあればAIマッチ
    };
  }

  return map;
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
): Promise<{ items: JobWithMetadata[]; total: number; totalAll: number }> {
  let jobs: Job[];
  let appliedJobIdsSet: Set<string> = new Set();
  let recommendationMap: Record<
    string,
    { score: number; staffRecommend: boolean; aiMatched: boolean }
  > = {};

  if (authUserId) {
    // ログインしている場合: 案件、応募履歴、推薦情報を並列で取得
    const [allJobs, appliedJobIds, recommendations] = await Promise.all([
      getAllJobs(),
      getAppliedJobIdsByAuthUserId(authUserId),
      getRecommendationsForUser(authUserId),
    ]);

    // 募集ステータスが「クローズ」の案件を除外
    jobs = allJobs.filter((job) => job.recruitmentStatus !== "クローズ");

    appliedJobIdsSet = new Set(appliedJobIds);
    recommendationMap = buildRecommendationMap(recommendations);
  } else {
    // 未ログイン: 案件のみ取得
    const allJobs = await getAllJobs();
    jobs = allJobs.filter((job) => job.recruitmentStatus !== "クローズ");
  }

  // 応募済み案件を除外（3ヶ月制限なし）
  jobs = jobs.filter((job) => !appliedJobIdsSet.has(job.id));

  // 案件に推薦情報を追加（応募済み案件は除外済みのためapplicationStatusは常にnull）
  const jobsWithMetadata: JobWithMetadata[] = jobs.map((job) => {
    const recommendation = recommendationMap[job.id];
    return {
      ...job,
      recommendationScore: recommendation?.score || 0,
      staffRecommend: recommendation?.staffRecommend || false,
      aiMatched: recommendation?.aiMatched || false,
      applicationStatus: null,
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
    totalAll: total, // SSR時はフィルター未適用なので同じ値
  };
}
