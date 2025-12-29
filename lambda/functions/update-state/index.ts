/**
 * UpdateState Lambda関数
 *
 * Step 3: バッチ処理完了後の状態更新
 * - lastBatchTime, lastThresholdを更新
 * - 処理結果の集計
 */

import { Handler } from "aws-lambda";
import { updateBatchState, closePool } from "../../shared/db";

interface JobResult {
  jobId: string;
  jobTitle: string;
  stats: {
    created: number;
    updated: number;
    deleted: number;
    kept: number;
    protected: number;
  };
}

interface UpdateStateInput {
  results: JobResult[];
  settings: {
    threshold: number;
    lastBatchTime: string | null;
    lastThreshold: number | null;
  };
}

interface UpdateStateOutput {
  success: boolean;
  summary: {
    jobsProcessed: number;
    totalCreated: number;
    totalUpdated: number;
    totalDeleted: number;
    totalKept: number;
    totalProtected: number;
  };
  threshold: number;
  executedAt: string;
}

export const handler: Handler<UpdateStateInput, UpdateStateOutput> = async (
  event
) => {
  console.log("UpdateState Lambda開始");
  const startTime = Date.now();

  try {
    const { results, settings } = event;

    // 結果を集計
    const summary = {
      jobsProcessed: results.length,
      totalCreated: 0,
      totalUpdated: 0,
      totalDeleted: 0,
      totalKept: 0,
      totalProtected: 0,
    };

    for (const result of results) {
      summary.totalCreated += result.stats.created;
      summary.totalUpdated += result.stats.updated;
      summary.totalDeleted += result.stats.deleted;
      summary.totalKept += result.stats.kept;
      summary.totalProtected += result.stats.protected;
    }

    console.log("処理結果集計:");
    console.log(`  案件数: ${summary.jobsProcessed}`);
    console.log(`  作成: ${summary.totalCreated}`);
    console.log(`  更新: ${summary.totalUpdated}`);
    console.log(`  削除: ${summary.totalDeleted}`);
    console.log(`  保持: ${summary.totalKept}`);
    console.log(`  保護: ${summary.totalProtected}`);

    // DBの状態を更新
    console.log("バッチ状態を更新中...");
    await updateBatchState(settings.threshold);

    const executedAt = new Date().toISOString();
    const elapsedMs = Date.now() - startTime;
    console.log(`UpdateState Lambda完了: ${elapsedMs}ms`);

    return {
      success: true,
      summary,
      threshold: settings.threshold,
      executedAt,
    };
  } catch (error) {
    console.error("UpdateState Lambdaエラー:", error);
    throw error;
  } finally {
    await closePool();
  }
};
