/**
 * サーバーサイド用の応募データ取得関数
 * APIルートを経由せず直接Kintoneからデータを取得することで、
 * HTTPラウンドトリップのオーバーヘッドを削減
 */

import { getApplicationsByAuthUserId } from "@/lib/kintone/services/application";
import { getJobsByIds } from "@/lib/kintone/services/job";
import type { Application, Job } from "@/lib/kintone/types";

export type ApplicationWithJob = Application & {
  job: Job | null;
};

/**
 * 認証ユーザーの応募履歴を案件情報付きで取得（サーバーサイド用）
 */
export async function getApplicationsWithJobs(
  authUserId: string
): Promise<ApplicationWithJob[]> {
  // 応募履歴を取得（3ヶ月以内、応募取消し除外済み）
  const applications = await getApplicationsByAuthUserId(authUserId);

  // 案件情報を一括取得（N+1問題解消）
  const jobIds = applications.map((app) => app.jobId);
  const jobMap = await getJobsByIds(jobIds);

  // 各応募に案件情報を紐付け
  return applications.map((app) => ({
    ...app,
    job: jobMap.get(app.jobId) || null,
  }));
}
