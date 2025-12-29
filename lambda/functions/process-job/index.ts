/**
 * ProcessJob Lambda関数
 *
 * Step 2: 1つの案件に対する推薦レコード処理
 * - 全人材とのスコア計算
 * - 既存レコードとの差分計算
 * - レコードの作成/更新/削除
 */

import { Handler } from "aws-lambda";
import {
  createRecommendationClient,
  getAppIds,
  RECOMMENDATION_FIELDS,
} from "../../shared/kintone";
import {
  calculateMatchScore,
  TalentForMatching,
  JobForMatching,
} from "../../shared/matching";

interface JobInfo {
  jobId: string;
  title: string;
  positions: string[];
  skills: string[];
  updatedAt: string;
}

interface TalentInfo {
  authUserId: string;
  name: string;
  positions: string[];
  skills: string;
  experience: string;
  updatedAt: string;
}

interface ProcessJobInput {
  job: JobInfo;
  talents: TalentInfo[];
  settings: {
    threshold: number;
    lastBatchTime: string | null;
    lastThreshold: number | null;
  };
  forceFullMode: boolean;
  // 全アクティブ人材ID（退会者判定用）
  activeTalentIds: string[];
}

interface ProcessJobOutput {
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

interface ExistingRecord {
  recordId: number;
  talentId: string;
  score: number;
  isProtected: boolean;
}

const BATCH_SIZE = 100;

// 既存レコードが保護対象かどうか判定
const isProtectedRecord = (
  record: Record<string, { value: unknown }>
): boolean => {
  const aiStatus = record[RECOMMENDATION_FIELDS.AI_EXECUTION_STATUS]
    ?.value as string;
  const staffRecommend = record[RECOMMENDATION_FIELDS.STAFF_RECOMMEND]
    ?.value as string;
  return aiStatus === "実行済み" || staffRecommend === "おすすめ";
};

// 更新対象かどうか判定（インクリメンタル計算）
const shouldCalculate = (
  talentUpdatedAt: string,
  jobUpdatedAt: string,
  lastBatchTime: string | null
): boolean => {
  if (!lastBatchTime) return true;
  const lastBatch = new Date(lastBatchTime);
  const talentDate = new Date(talentUpdatedAt);
  const jobDate = new Date(jobUpdatedAt);
  return talentDate > lastBatch || jobDate > lastBatch;
};

export const handler: Handler<ProcessJobInput, ProcessJobOutput> = async (
  event
) => {
  const { job, talents, settings, forceFullMode, activeTalentIds } = event;
  console.log(`ProcessJob開始: ${job.title} (ID: ${job.jobId})`);
  const startTime = Date.now();

  const stats = {
    created: 0,
    updated: 0,
    deleted: 0,
    kept: 0,
    protected: 0,
  };

  try {
    const client = createRecommendationClient();
    const appIds = getAppIds();
    const activeTalentIdSet = new Set(activeTalentIds);

    // 1. この案件の既存推薦レコードを取得
    const existingRecords = await client.record.getAllRecords({
      app: appIds.recommendation,
      condition: `${RECOMMENDATION_FIELDS.JOB_ID} = "${job.jobId}"`,
      fields: [
        "$id",
        RECOMMENDATION_FIELDS.TALENT_ID,
        RECOMMENDATION_FIELDS.SCORE,
        RECOMMENDATION_FIELDS.AI_EXECUTION_STATUS,
        RECOMMENDATION_FIELDS.STAFF_RECOMMEND,
      ],
    });

    // 既存レコードをマップ化
    const existingMap = new Map<string, ExistingRecord>();
    for (const record of existingRecords) {
      const talentId = String(
        record[RECOMMENDATION_FIELDS.TALENT_ID]?.value || ""
      );
      existingMap.set(talentId, {
        recordId: parseInt(String(record.$id.value), 10),
        talentId,
        score: parseInt(
          String(record[RECOMMENDATION_FIELDS.SCORE]?.value || "0"),
          10
        ),
        isProtected: isProtectedRecord(record),
      });
    }

    console.log(`既存レコード数: ${existingMap.size}件`);

    // 2. スコア計算（インクリメンタル or フル）
    const jobForMatching: JobForMatching = {
      id: job.jobId,
      jobId: job.jobId,
      title: job.title,
      positions: job.positions,
      skills: job.skills,
    };

    const newScores = new Map<string, number>();

    for (const talent of talents) {
      // インクリメンタルモード: 更新対象のみ計算
      if (
        !forceFullMode &&
        !shouldCalculate(
          talent.updatedAt,
          job.updatedAt,
          settings.lastBatchTime
        )
      ) {
        // 既存スコアがあればそのまま使用
        const existing = existingMap.get(talent.authUserId);
        if (existing && existing.score >= settings.threshold) {
          newScores.set(talent.authUserId, existing.score);
        }
        continue;
      }

      // スコア計算
      const talentForMatching: TalentForMatching = {
        id: talent.authUserId,
        authUserId: talent.authUserId,
        name: talent.name,
        positions: talent.positions,
        skills: talent.skills,
        experience: talent.experience,
      };

      const result = calculateMatchScore(talentForMatching, jobForMatching);
      if (result.score >= settings.threshold) {
        newScores.set(talent.authUserId, result.score);
      }
    }

    console.log(`閾値以上のスコア: ${newScores.size}件`);

    // 3. 差分計算
    const toCreate: { talentId: string; score: number }[] = [];
    const toUpdate: { recordId: number; score: number }[] = [];
    const toDelete: number[] = [];

    // 既存レコードをチェック
    for (const [talentId, existing] of existingMap) {
      // 人材が退会/存在しない → 削除
      if (!activeTalentIdSet.has(talentId)) {
        toDelete.push(existing.recordId);
        continue;
      }

      // 保護対象は保持
      if (existing.isProtected) {
        stats.protected++;
        continue;
      }

      const newScore = newScores.get(talentId);

      if (newScore === undefined) {
        // 閾値未満になった → 削除
        toDelete.push(existing.recordId);
      } else if (newScore !== existing.score) {
        // スコア変更 → 更新
        toUpdate.push({ recordId: existing.recordId, score: newScore });
      } else {
        // 変更なし → 保持
        stats.kept++;
      }
    }

    // 新規作成対象
    for (const [talentId, score] of newScores) {
      if (!existingMap.has(talentId)) {
        toCreate.push({ talentId, score });
      }
    }

    console.log(
      `差分: 作成=${toCreate.length}, 更新=${toUpdate.length}, 削除=${toDelete.length}`
    );

    // 4. レコード操作
    // 削除
    if (toDelete.length > 0) {
      for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const batch = toDelete.slice(i, i + BATCH_SIZE);
        await client.record.deleteRecords({
          app: appIds.recommendation,
          ids: batch,
        });
      }
      stats.deleted = toDelete.length;
    }

    // 更新
    if (toUpdate.length > 0) {
      const updateRecords = toUpdate.map((u) => ({
        id: u.recordId,
        record: {
          [RECOMMENDATION_FIELDS.SCORE]: { value: String(u.score) },
        },
      }));
      for (let i = 0; i < updateRecords.length; i += BATCH_SIZE) {
        const batch = updateRecords.slice(i, i + BATCH_SIZE);
        await client.record.updateRecords({
          app: appIds.recommendation,
          records: batch,
        });
      }
      stats.updated = toUpdate.length;
    }

    // 作成
    if (toCreate.length > 0) {
      const createRecords = toCreate.map((c) => ({
        [RECOMMENDATION_FIELDS.TALENT_ID]: { value: c.talentId },
        [RECOMMENDATION_FIELDS.JOB_ID]: { value: job.jobId },
        [RECOMMENDATION_FIELDS.SCORE]: { value: String(c.score) },
      }));
      for (let i = 0; i < createRecords.length; i += BATCH_SIZE) {
        const batch = createRecords.slice(i, i + BATCH_SIZE);
        await client.record.addRecords({
          app: appIds.recommendation,
          records: batch,
        });
      }
      stats.created = toCreate.length;
    }

    const elapsedMs = Date.now() - startTime;
    console.log(
      `ProcessJob完了: ${job.title} (${elapsedMs}ms) - 作成=${stats.created}, 更新=${stats.updated}, 削除=${stats.deleted}`
    );

    return {
      jobId: job.jobId,
      jobTitle: job.title,
      stats,
    };
  } catch (error) {
    console.error(`ProcessJobエラー (${job.jobId}):`, error);
    throw error;
  }
};
