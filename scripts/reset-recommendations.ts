/**
 * 推薦データリセットスクリプト
 *
 * 推薦DB（Kintone）のレコードを全削除し、DB設定の閾値に基づいて再作成する
 *
 * 使用方法:
 *   npm run recommend:reset
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local を読み込む
config({ path: resolve(process.cwd(), ".env.local") });

import {
  createRecommendationClient,
  createJobClient,
  createTalentClient,
  getAppIds,
} from "../lib/kintone/client";
import { RECOMMENDATION_FIELDS, JOB_FIELDS, TALENT_FIELDS } from "../lib/kintone/fieldMapping";
import {
  calculateMatchScore,
  type TalentForMatching,
  type JobForMatching,
} from "../lib/matching/calculateScore";
import { getDb, schema, closePool } from "../lib/db/client";
import { eq } from "drizzle-orm";

const BATCH_SIZE = 100;
const DEFAULT_THRESHOLD = 3;

/**
 * DBから設定を取得
 */
async function getSettingsFromDb(): Promise<{ scoreThreshold: number }> {
  try {
    const db = getDb();
    const settings = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.id, "default"))
      .limit(1);

    if (settings.length === 0) {
      return { scoreThreshold: DEFAULT_THRESHOLD };
    }

    return {
      scoreThreshold: settings[0].scoreThreshold,
    };
  } catch (error) {
    console.warn("DB設定の取得に失敗しました。デフォルト値を使用します:", error);
    return { scoreThreshold: DEFAULT_THRESHOLD };
  }
}

/**
 * 全推薦レコードを削除
 */
async function deleteAllRecommendations(): Promise<number> {
  const client = createRecommendationClient();
  const appId = getAppIds().recommendation;

  console.log("1. 既存の推薦レコードを取得中...");
  const records = await client.record.getAllRecords({
    app: appId,
    fields: ["$id"],
  });

  if (records.length === 0) {
    console.log("   → 削除対象なし");
    return 0;
  }

  console.log(`   → ${records.length}件のレコードを削除中...`);
  const ids = records.map((r) => parseInt(String(r.$id.value), 10));

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    await client.record.deleteRecords({
      app: appId,
      ids: batch,
    });
    console.log(`   削除: ${Math.min(i + BATCH_SIZE, ids.length)}/${ids.length}件`);
  }

  return ids.length;
}

/**
 * アクティブな案件を取得（掲載用ステータス=有、募集中）
 */
async function getActiveJobs(): Promise<JobForMatching[]> {
  const client = createJobClient();
  const appId = getAppIds().job;

  console.log("2. アクティブな案件を取得中...");
  const records = await client.record.getAllRecords({
    app: appId,
    condition: `${JOB_FIELDS.LISTING_STATUS} in ("有") and ${JOB_FIELDS.RECRUITMENT_STATUS} in ("募集中")`,
  });

  const jobs = records.map((record) => ({
    id: String(record.$id.value),
    jobId: String(record[JOB_FIELDS.JOB_ID]?.value || record.$id.value),
    title: String(record[JOB_FIELDS.TITLE]?.value || ""),
    positions: parseMultiSelect(record[JOB_FIELDS.POSITION]?.value),
    skills: parseMultiSelect(record[JOB_FIELDS.SKILLS]?.value),
  }));

  console.log(`   → ${jobs.length}件の案件を取得`);
  return jobs;
}

/**
 * 全人材を取得（退会者除外）
 */
async function getAllTalents(): Promise<TalentForMatching[]> {
  const client = createTalentClient();
  const appId = getAppIds().talent;

  console.log("3. 人材を取得中...");
  const records = await client.record.getAllRecords({
    app: appId,
    condition: `${TALENT_FIELDS.ST} not in ("退会")`,
  });

  const talents = records.map((record) => ({
    id: String(record.$id.value),
    authUserId: String(record[TALENT_FIELDS.AUTH_USER_ID]?.value || ""),
    name: String(record[TALENT_FIELDS.FULL_NAME]?.value || ""),
    positions: parseMultiSelect(record["職種"]?.value),
    skills: String(record[TALENT_FIELDS.SKILLS]?.value || ""),
    experience: String(record[TALENT_FIELDS.EXPERIENCE]?.value || ""),
    desiredRate: String(record[TALENT_FIELDS.DESIRED_RATE]?.value || ""),
  }));

  console.log(`   → ${talents.length}件の人材を取得`);
  return talents;
}

/**
 * 複数選択フィールドをパース
 */
function parseMultiSelect(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v));
  }
  if (typeof value === "string") {
    return value.split(/[,、]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * 推薦レコードを作成（スコア計算して閾値以上のみ）
 */
async function createRecommendations(
  jobs: JobForMatching[],
  talents: TalentForMatching[],
  threshold: number
): Promise<number> {
  const client = createRecommendationClient();
  const appId = getAppIds().recommendation;

  console.log("4. スコア計算・推薦レコード作成中...");

  const allMatches: { talentAuthUserId: string; jobId: string; score: number }[] = [];

  for (const job of jobs) {
    for (const talent of talents) {
      const result = calculateMatchScore(talent, job);

      // 閾値以上のマッチをすべて追加（人数制限なし）
      if (result.score >= threshold) {
        allMatches.push({
          talentAuthUserId: talent.authUserId,
          jobId: job.jobId,
          score: result.score,
        });
      }
    }
  }

  if (allMatches.length === 0) {
    console.log("   → 作成対象なし");
    return 0;
  }

  const records = allMatches.map((match) => ({
    [RECOMMENDATION_FIELDS.TALENT_ID]: { value: match.talentAuthUserId },
    [RECOMMENDATION_FIELDS.JOB_ID]: { value: match.jobId },
    [RECOMMENDATION_FIELDS.SCORE]: { value: String(match.score) },
  }));

  let created = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await client.record.addRecords({
      app: appId,
      records: batch,
    });
    created += batch.length;
    console.log(`   作成: ${created}/${records.length}件`);
  }

  return created;
}

/**
 * メイン処理
 */
async function main() {
  const startTime = Date.now();

  console.log("");
  console.log("========================================");
  console.log("推薦データリセット");
  console.log("========================================");
  console.log("");

  try {
    // 0. DB設定を取得
    console.log("DB設定を取得中...");
    const settings = await getSettingsFromDb();
    console.log(`閾値: ${settings.scoreThreshold}ポイント以上`);
    console.log("");

    // 1. 全削除
    const deleted = await deleteAllRecommendations();

    // 2. アクティブな案件を取得
    const jobs = await getActiveJobs();

    // 3. 人材を取得
    const talents = await getAllTalents();

    // 4. スコア計算して再作成（人数制限なし）
    const created = await createRecommendations(
      jobs,
      talents,
      settings.scoreThreshold
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("");
    console.log("========================================");
    console.log("完了");
    console.log("========================================");
    console.log(`削除: ${deleted}件`);
    console.log(`案件数: ${jobs.length}件`);
    console.log(`人材数: ${talents.length}件`);
    console.log(`作成: ${created}件`);
    console.log(`処理時間: ${elapsed}秒`);
    console.log("========================================");
    console.log("");

  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("エラーが発生しました");
    console.error("========================================");
    console.error(error);
    await closePool();
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
