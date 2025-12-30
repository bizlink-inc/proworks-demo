/**
 * ダッシュボード用の全データ取得関数
 * SSRで案件一覧、応募済み案件、マイページのデータを一括取得
 */

import { getJobsWithRecommendations, type JobWithMetadata } from "./jobs";
import { getApplicationsByAuthUserId } from "@/lib/kintone/services/application";
import { getJobsByIds } from "@/lib/kintone/services/job";
import { getTalentByAuthUserId } from "@/lib/kintone/services/talent";
import type { Job, Talent, Application } from "@/lib/kintone/types";

export type ApplicationWithJob = Application & {
  job: Job | null;
};

export interface DashboardData {
  jobs: {
    items: JobWithMetadata[];
    total: number;
    totalAll: number;
  };
  applications: ApplicationWithJob[];
  profile: Talent | null;
}

/**
 * 応募履歴に案件情報を紐付けて取得
 */
async function getApplicationsWithJobs(userId: string): Promise<ApplicationWithJob[]> {
  try {
    const applications = await getApplicationsByAuthUserId(userId);

    if (applications.length === 0) {
      return [];
    }

    const jobIds = applications.map(app => app.jobId);
    const jobMap = await getJobsByIds(jobIds);

    return applications.map((app) => ({
      ...app,
      job: jobMap.get(app.jobId) || null,
    }));
  } catch (error) {
    console.error("[getDashboardData] 応募履歴取得エラー:", error);
    return [];
  }
}

/**
 * ダッシュボード用の全データを並列取得
 * @param userId - 認証ユーザーID
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  console.log(`[getDashboardData] 開始: userId=${userId}`);
  const startTime = Date.now();

  // 全データを並列取得（待ち時間を最小化）
  const [jobsData, applications, profile] = await Promise.all([
    getJobsWithRecommendations(userId), // 全件取得（ページネーションなし）
    getApplicationsWithJobs(userId),
    getTalentByAuthUserId(userId).catch((error) => {
      console.error("[getDashboardData] プロフィール取得エラー:", error);
      return null;
    }),
  ]);

  const elapsed = Date.now() - startTime;
  console.log(`[getDashboardData] 完了: ${elapsed}ms`);
  console.log(`[getDashboardData] jobs=${jobsData.total}件, applications=${applications.length}件, profile=${profile ? 'あり' : 'なし'}`);

  return {
    jobs: jobsData,
    applications,
    profile,
  };
}
