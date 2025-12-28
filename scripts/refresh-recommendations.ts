/**
 * 推薦レコード更新バッチスクリプト（差分更新・インクリメンタル計算対応）
 *
 * 推薦DB（Kintone）のレコードを差分更新する:
 * 1. 前回バッチ実行以降に更新された案件・人材のみを対象に計算（高速化）
 * 2. 新しいスコアを計算
 * 3. 差分のみ更新:
 *    - 削除: スコアが閾値未満になった or 案件が非アクティブになったレコード
 *    - 作成: 新しい組み合わせのみ
 *    - 保持: 既存のまま有効なレコードは触らない
 *
 * ※ AIマッチ済み/担当者おすすめのレコードは常に保持
 * ※ 既存レコードを削除→再作成しないため、通知の重複送信を防止
 * ※ インクリメンタル計算により大規模データでも高速処理
 *
 * 使用方法:
 *   npx tsx scripts/refresh-recommendations.ts [options]
 *
 * オプション:
 *   --threshold, -t   スコア閾値（未指定の場合はDBから取得、DBにもなければ3）
 *   --full            全組み合わせを再計算（インクリメンタル計算をスキップ）
 *   --dry-run         ドライラン（削除・登録せず確認のみ）
 *   --verbose         詳細ログを出力
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local を読み込む
config({ path: resolve(process.cwd(), ".env.local") });
import { parseArgs } from "util";
import {
  createRecommendationClient,
  createJobClient,
  createTalentClient,
  getAppIds,
} from "../lib/kintone/client";
import {
  RECOMMENDATION_FIELDS,
  JOB_FIELDS,
  TALENT_FIELDS,
} from "../lib/kintone/fieldMapping";
import {
  calculateMatchScore,
  type TalentForMatching,
  type JobForMatching,
} from "../lib/matching/calculateScore";
import { getDb, schema, closePool } from "../lib/db/client";
import { eq } from "drizzle-orm";

// ========================================
// 設定
// ========================================

const DEFAULT_THRESHOLD = 3;
const BATCH_SIZE = 100;

// ========================================
// 型定義
// ========================================

interface Options {
  threshold: number;
  full: boolean;      // 全組み合わせを再計算（インクリメンタル計算をスキップ）
  dryRun: boolean;
  verbose: boolean;
}

interface Stats {
  totalRecordsBefore: number;
  recordsDeleted: number;
  recordsKept: number;          // 既存のまま保持（変更なし）
  recordsUpdated: number;       // スコア更新
  recordsProtected: number;     // AIマッチ済み/おすすめで保護
  jobsProcessed: number;
  talentsProcessed: number;
  recordsCreated: number;
  executionTimeMs: number;
  // インクリメンタル計算用
  incrementalMode: boolean;
  updatedJobsCount: number;
  updatedTalentsCount: number;
  calculationsPerformed: number;
  calculationsSkipped: number;
}

interface ExistingRecord {
  recordId: number;
  talentId: string;
  jobId: string;
  score: number;
  isProtected: boolean;  // AIマッチ済み or おすすめ
}

interface DbSettings {
  scoreThreshold: number;
  lastBatchTime: Date | null;
  lastThreshold: number | null;  // 前回バッチ実行時の閾値
}

type ThresholdChange = "unchanged" | "increased" | "decreased";

// ========================================
// ユーティリティ
// ========================================

function log(message: string, verbose: boolean = false, isVerbose: boolean = false) {
  if (isVerbose && !verbose) return;
  console.log(message);
}

/**
 * DBから設定を取得（閾値と前回バッチ実行日時）
 */
async function getSettingsFromDb(): Promise<DbSettings | null> {
  try {
    const db = getDb();
    const settings = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.id, "default"))
      .limit(1);

    if (settings.length === 0) {
      return null;
    }

    return {
      scoreThreshold: settings[0].scoreThreshold,
      lastBatchTime: settings[0].lastBatchTime,
      lastThreshold: settings[0].lastThreshold,
    };
  } catch (error) {
    console.warn("DB設定の取得に失敗しました。デフォルト値を使用します:", error);
    return null;
  }
}

/**
 * 閾値変更を検知
 */
function detectThresholdChange(currentThreshold: number, lastThreshold: number | null): ThresholdChange {
  if (lastThreshold === null) {
    return "unchanged";  // 初回実行時は変更なしとして扱う
  }
  if (currentThreshold > lastThreshold) {
    return "increased";
  }
  if (currentThreshold < lastThreshold) {
    return "decreased";
  }
  return "unchanged";
}

/**
 * 前回バッチ実行日時と閾値を更新
 */
async function updateBatchState(dryRun: boolean, threshold: number): Promise<void> {
  if (dryRun) return;

  try {
    const db = getDb();
    const now = new Date();

    // upsert: レコードがなければ作成、あれば更新
    await db
      .insert(schema.appSettings)
      .values({
        id: "default",
        scoreThreshold: DEFAULT_THRESHOLD,
        lastBatchTime: now,
        lastThreshold: threshold,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.appSettings.id,
        set: {
          lastBatchTime: now,
          lastThreshold: threshold,
          updatedAt: now,
        },
      });
  } catch (error) {
    console.warn("バッチ実行状態の更新に失敗しました:", error);
  }
}

// ========================================
// Kintone操作
// ========================================

/**
 * 全推薦レコードを取得
 */
async function getAllRecommendations() {
  const client = createRecommendationClient();
  const appId = getAppIds().recommendation;

  const records = await client.record.getAllRecords({
    app: appId,
    fields: [
      "$id",
      RECOMMENDATION_FIELDS.TALENT_ID,
      RECOMMENDATION_FIELDS.JOB_ID,
      RECOMMENDATION_FIELDS.SCORE,
      RECOMMENDATION_FIELDS.AI_EXECUTION_STATUS,
      RECOMMENDATION_FIELDS.STAFF_RECOMMEND,
    ],
  });

  return records;
}

/**
 * レコードが保護対象かどうかを判定（AIマッチ済み or おすすめ）
 */
function isProtectedRecord(record: Record<string, { value: unknown }>): boolean {
  const aiStatus = record[RECOMMENDATION_FIELDS.AI_EXECUTION_STATUS]?.value as string;
  const staffRecommend = record[RECOMMENDATION_FIELDS.STAFF_RECOMMEND]?.value as string;

  // AIマッチ実行済み → 保護
  if (aiStatus === "実行済み") return true;

  // 担当者おすすめ → 保護
  if (staffRecommend === "おすすめ") return true;

  return false;
}

/**
 * 既存レコードをExistingRecord形式にパース
 */
function parseExistingRecords(records: Record<string, { value: unknown }>[]): ExistingRecord[] {
  return records.map((record) => ({
    recordId: parseInt(String(record.$id.value), 10),
    talentId: String(record[RECOMMENDATION_FIELDS.TALENT_ID]?.value || ""),
    jobId: String(record[RECOMMENDATION_FIELDS.JOB_ID]?.value || ""),
    score: parseInt(String(record[RECOMMENDATION_FIELDS.SCORE]?.value || "0"), 10),
    isProtected: isProtectedRecord(record),
  }));
}

/**
 * レコードを削除
 */
async function deleteRecords(recordIds: number[], dryRun: boolean, verbose: boolean) {
  if (recordIds.length === 0) return;
  if (dryRun) {
    log(`   [DRY-RUN] ${recordIds.length}件のレコードを削除（スキップ）`, verbose);
    return;
  }

  const client = createRecommendationClient();
  const appId = getAppIds().recommendation;

  // バッチ削除（100件ずつ）
  for (let i = 0; i < recordIds.length; i += BATCH_SIZE) {
    const batch = recordIds.slice(i, i + BATCH_SIZE);
    await client.record.deleteRecords({
      app: appId,
      ids: batch,
    });
    log(`   削除: ${i + batch.length}/${recordIds.length}件`, verbose, true);
  }
}

/**
 * レコードのスコアを更新
 */
async function updateRecords(
  updates: { recordId: number; score: number }[],
  dryRun: boolean,
  verbose: boolean
): Promise<number> {
  if (updates.length === 0) return 0;
  if (dryRun) {
    log(`   [DRY-RUN] ${updates.length}件のレコードを更新（スキップ）`, verbose);
    return updates.length;
  }

  const client = createRecommendationClient();
  const appId = getAppIds().recommendation;

  // レコード形式に変換
  const records = updates.map((update) => ({
    id: update.recordId,
    record: {
      [RECOMMENDATION_FIELDS.SCORE]: { value: String(update.score) },
    },
  }));

  // バッチ更新（100件ずつ）
  let updated = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await client.record.updateRecords({
      app: appId,
      records: batch,
    });
    updated += batch.length;
    log(`   更新: ${updated}/${records.length}件`, verbose, true);
  }

  return updated;
}

/**
 * アクティブな案件を取得（掲載用ステータス=有、募集中）
 */
async function getActiveJobs(): Promise<(JobForMatching & { updatedAt: Date })[]> {
  const client = createJobClient();
  const appId = getAppIds().job;

  const records = await client.record.getAllRecords({
    app: appId,
    condition: `${JOB_FIELDS.LISTING_STATUS} in ("有") and ${JOB_FIELDS.RECRUITMENT_STATUS} in ("募集中")`,
  });

  return records.map((record) => ({
    id: String(record.$id.value),
    jobId: String(record.$id.value),
    title: String(record[JOB_FIELDS.TITLE]?.value || ""),
    positions: parseMultiSelect(record[JOB_FIELDS.POSITION]?.value),
    skills: parseMultiSelect(record[JOB_FIELDS.SKILLS]?.value),
    updatedAt: new Date(String(record[JOB_FIELDS.UPDATED_AT]?.value || "")),
  }));
}

/**
 * 全人材を取得（退会者除外）
 */
async function getAllTalents(): Promise<(TalentForMatching & { updatedAt: Date })[]> {
  const client = createTalentClient();
  const appId = getAppIds().talent;

  const records = await client.record.getAllRecords({
    app: appId,
    condition: `${TALENT_FIELDS.ST} not in ("退会")`,
  });

  return records.map((record) => ({
    id: String(record.$id.value),
    authUserId: String(record[TALENT_FIELDS.AUTH_USER_ID]?.value || ""),
    name: String(record[TALENT_FIELDS.FULL_NAME]?.value || ""),
    positions: parseMultiSelect(record["職種"]?.value), // 人材DBの職種フィールド
    skills: String(record[TALENT_FIELDS.SKILLS]?.value || ""),
    experience: String(record[TALENT_FIELDS.EXPERIENCE]?.value || ""),
    desiredRate: String(record[TALENT_FIELDS.DESIRED_RATE]?.value || ""),
    updatedAt: new Date(String(record[TALENT_FIELDS.UPDATED_AT]?.value || "")),
  }));
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
 * 既存レコードをtalentId-jobIdでマップ化
 */
function buildExistingRecordsMap(records: ExistingRecord[]): Map<string, ExistingRecord> {
  const map = new Map<string, ExistingRecord>();
  for (const record of records) {
    const key = `${record.talentId}-${record.jobId}`;
    map.set(key, record);
  }
  return map;
}

/**
 * 推薦レコードを一括登録
 */
async function createRecommendations(
  matches: { talentAuthUserId: string; jobId: string; score: number }[],
  dryRun: boolean,
  verbose: boolean
) {
  if (matches.length === 0) return 0;
  if (dryRun) {
    log(`   [DRY-RUN] ${matches.length}件のレコードを作成（スキップ）`, verbose);
    return matches.length;
  }

  const client = createRecommendationClient();
  const appId = getAppIds().recommendation;

  // レコード形式に変換
  const records = matches.map((match) => ({
    [RECOMMENDATION_FIELDS.TALENT_ID]: { value: match.talentAuthUserId },
    [RECOMMENDATION_FIELDS.JOB_ID]: { value: match.jobId },
    [RECOMMENDATION_FIELDS.SCORE]: { value: String(match.score) },
  }));

  // バッチ登録
  let created = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await client.record.addRecords({
      app: appId,
      records: batch,
    });
    created += batch.length;
    log(`   作成: ${created}/${records.length}件`, verbose, true);
  }

  return created;
}

// ========================================
// インクリメンタル計算
// ========================================

/**
 * 更新された案件・人材を特定
 */
function identifyUpdatedRecords(
  jobs: (JobForMatching & { updatedAt: Date })[],
  talents: (TalentForMatching & { updatedAt: Date })[],
  lastBatchTime: Date | null
): { updatedJobIds: Set<string>; updatedTalentIds: Set<string> } {
  const updatedJobIds = new Set<string>();
  const updatedTalentIds = new Set<string>();

  if (!lastBatchTime) {
    // 前回バッチ実行日時がない場合は全て対象
    jobs.forEach((job) => updatedJobIds.add(job.jobId));
    talents.forEach((talent) => updatedTalentIds.add(talent.authUserId));
  } else {
    // 前回バッチ以降に更新されたもののみ
    for (const job of jobs) {
      if (job.updatedAt > lastBatchTime) {
        updatedJobIds.add(job.jobId);
      }
    }
    for (const talent of talents) {
      if (talent.updatedAt > lastBatchTime) {
        updatedTalentIds.add(talent.authUserId);
      }
    }
  }

  return { updatedJobIds, updatedTalentIds };
}

/**
 * インクリメンタル計算で対象となる組み合わせかどうかを判定
 */
function shouldCalculate(
  jobId: string,
  talentId: string,
  updatedJobIds: Set<string>,
  updatedTalentIds: Set<string>
): boolean {
  // 更新された案件 または 更新された人材 の組み合わせのみ計算
  return updatedJobIds.has(jobId) || updatedTalentIds.has(talentId);
}

// ========================================
// メイン処理
// ========================================

async function main() {
  const startTime = Date.now();

  // 引数パース
  const { values } = parseArgs({
    options: {
      threshold: { type: "string", short: "t" },
      full: { type: "boolean" },
      "dry-run": { type: "boolean" },
      verbose: { type: "boolean", short: "v" },
    },
  });

  // DBから設定を取得
  console.log("DBから設定を取得中...");
  const dbSettings = await getSettingsFromDb();
  if (dbSettings) {
    console.log(`DB設定: 閾値=${dbSettings.scoreThreshold}, 前回閾値=${dbSettings.lastThreshold ?? "なし"}, 前回バッチ=${dbSettings.lastBatchTime?.toISOString() || "なし"}`);
  }

  const options: Options = {
    threshold: values.threshold
      ? parseInt(values.threshold, 10)
      : (dbSettings?.scoreThreshold ?? DEFAULT_THRESHOLD),
    full: values.full ?? false,
    dryRun: values["dry-run"] ?? false,
    verbose: values.verbose ?? false,
  };

  // 閾値変更を検知
  const thresholdChange = detectThresholdChange(options.threshold, dbSettings?.lastThreshold ?? null);
  if (thresholdChange !== "unchanged") {
    console.log(`閾値変更検知: ${dbSettings?.lastThreshold} → ${options.threshold} (${thresholdChange === "increased" ? "上昇" : "下降"})`);
  }

  // フルモードの判定
  // - 明示的に--fullオプション指定
  // - 前回バッチ実行日時がない（初回）
  // - 閾値が下がった（新たに閾値を満たすペアを探す必要）
  const forceFullMode = options.full || !dbSettings?.lastBatchTime || thresholdChange === "decreased";

  // 閾値上昇時の削除のみモード
  const thresholdDeleteOnly = thresholdChange === "increased" && !options.full;

  // 実行モードの決定
  let executionMode: string;
  if (thresholdDeleteOnly) {
    executionMode = "閾値上昇削除のみ";
  } else if (forceFullMode) {
    executionMode = "フル計算";
  } else {
    executionMode = "インクリメンタル計算";
  }

  console.log("");
  console.log("========================================");
  console.log("推薦レコード更新バッチ");
  console.log("========================================");
  console.log(`閾値: ${options.threshold}ポイント以上`);
  console.log(`計算モード: ${executionMode}`);
  if (thresholdDeleteOnly) {
    console.log(`  → 閾値が${dbSettings?.lastThreshold}→${options.threshold}に上昇`);
    console.log(`  → スコア${options.threshold}未満のレコードを削除のみ`);
  }
  console.log(`ドライラン: ${options.dryRun ? "はい" : "いいえ"}`);
  console.log("========================================");
  console.log("");

  const stats: Stats = {
    totalRecordsBefore: 0,
    recordsDeleted: 0,
    recordsKept: 0,
    recordsUpdated: 0,
    recordsProtected: 0,
    jobsProcessed: 0,
    talentsProcessed: 0,
    recordsCreated: 0,
    executionTimeMs: 0,
    incrementalMode: !forceFullMode,
    updatedJobsCount: 0,
    updatedTalentsCount: 0,
    calculationsPerformed: 0,
    calculationsSkipped: 0,
  };

  try {
    // 1. 現在の推薦レコードを取得
    console.log("1. 現在の推薦レコードを取得中...");
    const rawRecords = await getAllRecommendations();
    const existingRecords = parseExistingRecords(rawRecords);
    const existingMap = buildExistingRecordsMap(existingRecords);
    stats.totalRecordsBefore = existingRecords.length;
    console.log(`   現在のレコード数: ${existingRecords.length}件`);

    // ========================================
    // 閾値上昇時の削除のみモード
    // ========================================
    if (thresholdDeleteOnly) {
      console.log("");
      console.log("2. 閾値未満のレコードを特定中...");

      const toDelete: number[] = [];
      for (const record of existingRecords) {
        // 保護対象（AIマッチ済み/おすすめ）は常に保持
        if (record.isProtected) {
          stats.recordsProtected++;
          continue;
        }
        // 新しい閾値未満のレコードを削除
        if (record.score < options.threshold) {
          toDelete.push(record.recordId);
        } else {
          stats.recordsKept++;
        }
      }

      console.log(`   削除対象（スコア${options.threshold}未満）: ${toDelete.length}件`);
      console.log(`   保持: ${stats.recordsKept}件`);
      console.log(`   保護（AIマッチ済み/おすすめ）: ${stats.recordsProtected}件`);

      // レコード削除
      console.log("");
      console.log("3. レコードを削除中...");
      await deleteRecords(toDelete, options.dryRun, options.verbose);
      stats.recordsDeleted = toDelete.length;
      console.log(`   削除完了: ${toDelete.length}件`);

      // バッチ実行状態を更新
      await updateBatchState(options.dryRun, options.threshold);

      // 結果出力
      stats.executionTimeMs = Date.now() - startTime;
      const totalAfter = stats.recordsKept + stats.recordsProtected;

      console.log("");
      console.log("========================================");
      console.log("処理完了（閾値上昇削除のみモード）");
      console.log("========================================");
      console.log(`閾値変更: ${dbSettings?.lastThreshold} → ${options.threshold}`);
      console.log(`処理前レコード数: ${stats.totalRecordsBefore}件`);
      console.log(`削除レコード数: ${stats.recordsDeleted}件`);
      console.log(`保持レコード数: ${stats.recordsKept}件`);
      console.log(`保護レコード数: ${stats.recordsProtected}件`);
      console.log(`処理後レコード数: ${totalAfter}件`);
      console.log(`処理時間: ${(stats.executionTimeMs / 1000).toFixed(2)}秒`);
      console.log("========================================");
      console.log("");

      if (options.dryRun) {
        console.log("[DRY-RUN] 実際の変更は行われていません");
        console.log("");
      }

      await closePool();
      return;
    }

    // ========================================
    // 通常モード（フル計算/インクリメンタル計算）
    // ========================================

    // 2. アクティブな案件を取得
    console.log("");
    console.log("2. アクティブな案件を取得中...");
    const jobs = await getActiveJobs();
    stats.jobsProcessed = jobs.length;
    console.log(`   案件数: ${jobs.length}件`);

    // アクティブな案件IDのセット（削除判定に使用）
    const activeJobIds = new Set(jobs.map((j) => j.jobId));

    // 3. 全人材を取得
    console.log("");
    console.log("3. 人材を取得中...");
    const talents = await getAllTalents();
    stats.talentsProcessed = talents.length;
    console.log(`   人材数: ${talents.length}件`);

    // 4. 更新された案件・人材を特定（インクリメンタルモードの場合）
    let updatedJobIds: Set<string>;
    let updatedTalentIds: Set<string>;

    if (forceFullMode) {
      // フルモード: 全て計算対象
      updatedJobIds = new Set(jobs.map((j) => j.jobId));
      updatedTalentIds = new Set(talents.map((t) => t.authUserId));
      stats.updatedJobsCount = jobs.length;
      stats.updatedTalentsCount = talents.length;
    } else {
      // インクリメンタルモード: 更新されたもののみ
      const updated = identifyUpdatedRecords(jobs, talents, dbSettings!.lastBatchTime);
      updatedJobIds = updated.updatedJobIds;
      updatedTalentIds = updated.updatedTalentIds;
      stats.updatedJobsCount = updatedJobIds.size;
      stats.updatedTalentsCount = updatedTalentIds.size;
      console.log("");
      console.log("4. 更新された案件・人材を特定中...");
      console.log(`   更新された案件: ${updatedJobIds.size}件`);
      console.log(`   更新された人材: ${updatedTalentIds.size}件`);
    }

    // 5. 新しいスコアを計算
    console.log("");
    console.log(forceFullMode ? "4. スコア計算中..." : "5. スコア計算中...");

    // 新しく推薦すべき組み合わせを計算
    // Map: jobId -> { talentId -> score }
    const newRecommendations = new Map<string, Map<string, number>>();
    // 計算対象外の既存レコードを保持するためのマップ
    const unchangedRecommendations = new Map<string, Map<string, number>>();

    for (const job of jobs) {
      const jobMatches: { talentId: string; score: number }[] = [];
      const jobUnchanged: { talentId: string; score: number }[] = [];

      for (const talent of talents) {
        // インクリメンタルモードでは、対象外の組み合わせは既存スコアを使用
        if (!forceFullMode && !shouldCalculate(job.jobId, talent.authUserId, updatedJobIds, updatedTalentIds)) {
          const existingRecord = existingMap.get(`${talent.authUserId}-${job.jobId}`);
          if (existingRecord && existingRecord.score >= options.threshold) {
            jobUnchanged.push({
              talentId: talent.authUserId,
              score: existingRecord.score,
            });
          }
          stats.calculationsSkipped++;
          continue;
        }

        // スコア計算
        const result = calculateMatchScore(talent, job);
        stats.calculationsPerformed++;
        if (result.score >= options.threshold) {
          jobMatches.push({
            talentId: talent.authUserId,
            score: result.score,
          });
        }
      }

      // 計算結果をマップに格納
      const jobRecommendations = new Map<string, number>();
      for (const match of jobMatches) {
        jobRecommendations.set(match.talentId, match.score);
      }
      newRecommendations.set(job.jobId, jobRecommendations);

      // 変更なしの既存レコードをマップに格納
      const jobUnchangedMap = new Map<string, number>();
      for (const match of jobUnchanged) {
        jobUnchangedMap.set(match.talentId, match.score);
      }
      unchangedRecommendations.set(job.jobId, jobUnchangedMap);

      log(`   案件[${job.jobId}] ${job.title}: 計算=${jobMatches.length}件, 既存維持=${jobUnchanged.length}件`, options.verbose, true);
    }

    if (!forceFullMode) {
      console.log(`   計算実行: ${stats.calculationsPerformed.toLocaleString()}回`);
      console.log(`   計算スキップ: ${stats.calculationsSkipped.toLocaleString()}回`);
      const savedPercent = stats.calculationsSkipped / (stats.calculationsPerformed + stats.calculationsSkipped) * 100;
      console.log(`   削減率: ${savedPercent.toFixed(1)}%`);
    }

    // 6. 差分を計算
    console.log("");
    console.log(forceFullMode ? "5. 差分を計算中..." : "6. 差分を計算中...");

    const toDelete: number[] = [];
    const toCreate: { talentAuthUserId: string; jobId: string; score: number }[] = [];
    const toUpdate: { recordId: number; score: number }[] = [];
    const keptCombinations = new Set<string>();

    // アクティブな人材IDのセット（退会者削除判定に使用）
    const activeTalentIds = new Set(talents.map((t) => t.authUserId));

    // 既存レコードをチェック（削除対象を特定）
    for (const record of existingRecords) {
      const key = `${record.talentId}-${record.jobId}`;

      // 1. 案件が非アクティブになった → 削除（保護レコードも削除）
      if (!activeJobIds.has(record.jobId)) {
        toDelete.push(record.recordId);
        log(`   削除: 案件非アクティブ [${key}]`, options.verbose, true);
        continue;
      }

      // 2. 人材が退会/存在しない → 削除（保護レコードも削除）
      if (!activeTalentIds.has(record.talentId)) {
        toDelete.push(record.recordId);
        log(`   削除: 人材退会/無効 [${key}]`, options.verbose, true);
        continue;
      }

      // 3. 保護対象（AIマッチ済み/おすすめ）は保持
      if (record.isProtected) {
        stats.recordsProtected++;
        keptCombinations.add(key);
        continue;
      }

      // 計算対象の組み合わせかチェック
      const isCalculationTarget = shouldCalculate(record.jobId, record.talentId, updatedJobIds, updatedTalentIds);

      if (isCalculationTarget) {
        // 計算対象: 新しい推薦リストに含まれているかチェック
        const jobRecommendations = newRecommendations.get(record.jobId);
        if (!jobRecommendations || !jobRecommendations.has(record.talentId)) {
          // スコアが閾値未満になった → 削除
          toDelete.push(record.recordId);
          log(`   削除: 推薦対象外 [${key}]`, options.verbose, true);
          continue;
        }

        // スコアが変更された場合は更新
        const newScore = jobRecommendations.get(record.talentId)!;
        if (newScore !== record.score) {
          toUpdate.push({ recordId: record.recordId, score: newScore });
          keptCombinations.add(key);
          log(`   更新: スコア変更 [${key}] ${record.score}→${newScore}`, options.verbose, true);
          continue;
        }
      } else {
        // 計算対象外: そのまま保持
        // （unchangedRecommendationsに含まれている場合のみ）
        const jobUnchanged = unchangedRecommendations.get(record.jobId);
        if (!jobUnchanged || !jobUnchanged.has(record.talentId)) {
          // 既存レコードがあるが、閾値未満になった可能性
          // → 安全のため保持（次回フル計算で対応）
        }
      }

      // 既存のまま有効 → 保持
      keptCombinations.add(key);
      stats.recordsKept++;
    }

    // 新規作成対象を特定（計算された組み合わせのみ）
    for (const [jobId, jobRecommendations] of newRecommendations) {
      for (const [talentId, score] of jobRecommendations) {
        const key = `${talentId}-${jobId}`;
        // 既存レコードがない場合のみ作成
        if (!existingMap.has(key)) {
          toCreate.push({
            talentAuthUserId: talentId,
            jobId: jobId,
            score: score,
          });
          log(`   作成: 新規推薦 [${key}] スコア=${score}`, options.verbose, true);
        }
      }
    }

    console.log(`   削除対象: ${toDelete.length}件`);
    console.log(`   スコア更新対象: ${toUpdate.length}件`);
    console.log(`   新規作成対象: ${toCreate.length}件`);
    console.log(`   保持（既存のまま）: ${stats.recordsKept}件`);
    console.log(`   保護（AIマッチ済み/おすすめ）: ${stats.recordsProtected}件`);

    // 7. レコード削除
    console.log("");
    console.log(forceFullMode ? "6. レコードを削除中..." : "7. レコードを削除中...");
    await deleteRecords(toDelete, options.dryRun, options.verbose);
    stats.recordsDeleted = toDelete.length;
    console.log(`   削除完了: ${toDelete.length}件`);

    // 8. レコード更新（スコア変更）
    console.log("");
    console.log(forceFullMode ? "7. レコードを更新中..." : "8. レコードを更新中...");
    stats.recordsUpdated = await updateRecords(toUpdate, options.dryRun, options.verbose);
    console.log(`   更新完了: ${stats.recordsUpdated}件`);

    // 9. レコード作成
    console.log("");
    console.log(forceFullMode ? "8. レコードを作成中..." : "9. レコードを作成中...");
    stats.recordsCreated = await createRecommendations(toCreate, options.dryRun, options.verbose);
    console.log(`   作成完了: ${stats.recordsCreated}件`);

    // 10. バッチ実行状態を更新（実行日時と閾値）
    await updateBatchState(options.dryRun, options.threshold);

    // 結果出力
    stats.executionTimeMs = Date.now() - startTime;

    const totalAfter = stats.recordsKept + stats.recordsUpdated + stats.recordsProtected + stats.recordsCreated;

    console.log("");
    console.log("========================================");
    console.log(`処理完了（${forceFullMode ? "フル計算" : "インクリメンタル計算"}）`);
    console.log("========================================");
    console.log(`処理前レコード数: ${stats.totalRecordsBefore}件`);
    console.log(`---`);
    if (!forceFullMode) {
      console.log(`更新案件数: ${stats.updatedJobsCount}件`);
      console.log(`更新人材数: ${stats.updatedTalentsCount}件`);
      console.log(`計算実行: ${stats.calculationsPerformed.toLocaleString()}回`);
      console.log(`計算スキップ: ${stats.calculationsSkipped.toLocaleString()}回`);
      console.log(`---`);
    }
    console.log(`削除レコード数: ${stats.recordsDeleted}件`);
    console.log(`  - 案件非アクティブ/人材退会/スコア閾値未満`);
    console.log(`スコア更新レコード数: ${stats.recordsUpdated}件`);
    console.log(`  - スキル変更等でスコアが変わったレコード`);
    console.log(`保持レコード数: ${stats.recordsKept}件`);
    console.log(`  - 既存のまま変更なし（通知なし）`);
    console.log(`保護レコード数: ${stats.recordsProtected}件`);
    console.log(`  - AIマッチ済み/担当者おすすめ`);
    console.log(`新規作成レコード数: ${stats.recordsCreated}件`);
    console.log(`  - 新しい推薦のみ（通知対象）`);
    console.log(`---`);
    console.log(`処理後レコード数: ${totalAfter}件`);
    console.log(`処理時間: ${(stats.executionTimeMs / 1000).toFixed(2)}秒`);
    console.log("========================================");
    console.log("");

    if (options.dryRun) {
      console.log("[DRY-RUN] 実際の変更は行われていません");
      console.log("");
    }

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
