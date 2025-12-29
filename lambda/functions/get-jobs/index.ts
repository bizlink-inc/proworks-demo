/**
 * GetJobs Lambda関数
 *
 * Step 1: アクティブな案件一覧とDB設定を取得
 * 案件ID配列と閾値情報を返す
 */

import { Handler } from "aws-lambda";
import {
  createJobClient,
  createTalentClient,
  getAppIds,
  JOB_FIELDS,
  TALENT_FIELDS,
} from "../../shared/kintone";
import { getSettingsFromDb, closePool } from "../../shared/db";

interface GetJobsInput {
  // 入力パラメータ（オプション）
  forceFullMode?: boolean;
}

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

interface GetJobsOutput {
  jobs: JobInfo[];
  talents: TalentInfo[];
  settings: {
    threshold: number;
    lastBatchTime: string | null;
    lastThreshold: number | null;
  };
  forceFullMode: boolean;
}

// 複数選択フィールドをパース
const parseMultiSelect = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }
  if (typeof value === "string") {
    return value
      .split(/[,、]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

export const handler: Handler<GetJobsInput, GetJobsOutput> = async (event) => {
  console.log("GetJobs Lambda開始");
  const startTime = Date.now();

  try {
    // DB設定を取得
    console.log("DB設定を取得中...");
    const dbSettings = await getSettingsFromDb();
    console.log(
      `DB設定: 閾値=${dbSettings.scoreThreshold}, 前回閾値=${dbSettings.lastThreshold ?? "なし"}, 前回バッチ=${dbSettings.lastBatchTime?.toISOString() || "なし"}`
    );

    // フルモード判定
    // - 明示的に指定
    // - 前回バッチ実行日時がない（初回）
    // - 閾値が下がった
    const thresholdDecreased =
      dbSettings.lastThreshold !== null &&
      dbSettings.scoreThreshold < dbSettings.lastThreshold;
    const forceFullMode =
      event.forceFullMode ||
      !dbSettings.lastBatchTime ||
      thresholdDecreased;

    if (thresholdDecreased) {
      console.log(
        `閾値下降検知: ${dbSettings.lastThreshold} → ${dbSettings.scoreThreshold}`
      );
    }

    // アクティブな案件を取得
    console.log("アクティブな案件を取得中...");
    const jobClient = createJobClient();
    const appIds = getAppIds();

    const jobRecords = await jobClient.record.getAllRecords({
      app: appIds.job,
      condition: `${JOB_FIELDS.LISTING_STATUS} in ("有") and ${JOB_FIELDS.RECRUITMENT_STATUS} in ("募集中")`,
    });

    const jobs: JobInfo[] = jobRecords.map((record) => ({
      jobId: String(record.$id.value),
      title: String(record[JOB_FIELDS.TITLE]?.value || ""),
      positions: parseMultiSelect(record[JOB_FIELDS.POSITION]?.value),
      skills: parseMultiSelect(record[JOB_FIELDS.SKILLS]?.value),
      updatedAt: String(record[JOB_FIELDS.UPDATED_AT]?.value || ""),
    }));

    console.log(`案件数: ${jobs.length}件`);

    // 全人材を取得（退会者除外）
    console.log("人材を取得中...");
    const talentClient = createTalentClient();

    const talentRecords = await talentClient.record.getAllRecords({
      app: appIds.talent,
      condition: `${TALENT_FIELDS.ST} not in ("退会")`,
    });

    const talents: TalentInfo[] = talentRecords.map((record) => ({
      authUserId: String(record[TALENT_FIELDS.AUTH_USER_ID]?.value || ""),
      name: String(record[TALENT_FIELDS.FULL_NAME]?.value || ""),
      positions: parseMultiSelect(record["職種"]?.value),
      skills: String(record[TALENT_FIELDS.SKILLS]?.value || ""),
      experience: String(record[TALENT_FIELDS.EXPERIENCE]?.value || ""),
      updatedAt: String(record[TALENT_FIELDS.UPDATED_AT]?.value || ""),
    }));

    console.log(`人材数: ${talents.length}件`);

    const elapsedMs = Date.now() - startTime;
    console.log(`GetJobs Lambda完了: ${elapsedMs}ms`);

    return {
      jobs,
      talents,
      settings: {
        threshold: dbSettings.scoreThreshold,
        lastBatchTime: dbSettings.lastBatchTime?.toISOString() || null,
        lastThreshold: dbSettings.lastThreshold,
      },
      forceFullMode,
    };
  } catch (error) {
    console.error("GetJobs Lambdaエラー:", error);
    throw error;
  } finally {
    await closePool();
  }
};
