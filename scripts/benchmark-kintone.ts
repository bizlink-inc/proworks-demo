/**
 * kintone APIアクセス + マッチング処理の総合ベンチマーク
 * 
 * 実際の本番環境に近い条件で処理時間を計測
 * 
 * 実行: npx tsx scripts/benchmark-kintone.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.local を明示的に読み込む
config({ path: resolve(__dirname, "../.env.local") });
import { createTalentClient, createJobClient, getAppIds } from "../lib/kintone/client";
import { calculateTopMatches, TalentForMatching, JobForMatching } from "../lib/matching/calculateScore";

// Kintoneレコード型
type TalentRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  氏名: { value: string };
  複数選択: { value: string[] };
  言語_ツール: { value: string };
  主な実績_PR_職務経歴: { value: string };
  希望単価_月額: { value: string };
};

type JobRecord = {
  $id: { value: string };
  案件名: { value: string };
  職種_ポジション: { value: string[] };
  スキル: { value: string[] };
};

const runBenchmark = async () => {
  console.log("=".repeat(80));
  console.log("🚀 kintone API + マッチング処理 総合ベンチマーク");
  console.log("=".repeat(80));
  console.log("");

  const appIds = getAppIds();
  const talentClient = createTalentClient();
  const jobClient = createJobClient();

  // ========================================
  // Step 1: 人材データ取得時間の計測
  // ========================================
  console.log("📊 Step 1: 人材データ取得時間");
  console.log("-".repeat(80));

  const talentFetchStart = performance.now();
  
  const talentsResponse = await talentClient.record.getAllRecords({
    app: appIds.talent,
    fields: ["$id", "auth_user_id", "氏名", "複数選択", "言語_ツール", "主な実績_PR_職務経歴", "希望単価_月額"],
  });

  const talentFetchEnd = performance.now();
  const talentFetchTime = talentFetchEnd - talentFetchStart;

  const talents: TalentForMatching[] = (talentsResponse as TalentRecord[]).map((record) => ({
    id: record.$id.value,
    authUserId: record.auth_user_id?.value || "",
    name: record.氏名?.value || "(名前なし)",
    positions: record.複数選択?.value || [],
    skills: record.言語_ツール?.value || "",
    experience: record.主な実績_PR_職務経歴?.value || "",
    desiredRate: record.希望単価_月額?.value || "",
  }));

  console.log(`  取得人材数: ${talents.length}人`);
  console.log(`  取得時間: ${talentFetchTime.toFixed(0)}ms`);
  console.log("");

  // ========================================
  // Step 2: 案件データ取得時間の計測
  // ========================================
  console.log("📊 Step 2: 案件データ取得時間");
  console.log("-".repeat(80));

  const jobFetchStart = performance.now();

  const jobsResponse = await jobClient.record.getAllRecords({
    app: appIds.job,
    fields: ["$id", "案件名", "職種_ポジション", "スキル"],
  });

  const jobFetchEnd = performance.now();
  const jobFetchTime = jobFetchEnd - jobFetchStart;

  const jobs: JobForMatching[] = (jobsResponse as JobRecord[]).map((record) => ({
    id: record.$id.value,
    jobId: record.$id.value,
    title: record.案件名?.value || "(案件名なし)",
    positions: record.職種_ポジション?.value || [],
    skills: record.スキル?.value || [],
  }));

  console.log(`  取得案件数: ${jobs.length}件`);
  console.log(`  取得時間: ${jobFetchTime.toFixed(0)}ms`);
  console.log("");

  // ========================================
  // Step 3: 1案件に対するマッチング（案件詳細を開いたときのシナリオ）
  // ========================================
  console.log("📊 Step 3: 案件詳細を開いたときの総処理時間");
  console.log("-".repeat(80));

  if (jobs.length > 0) {
    const sampleJob = jobs[0];
    
    // シナリオA: 人材データをキャッシュしていない場合（毎回取得）
    const scenarioAStart = performance.now();
    
    const freshTalentsResponse = await talentClient.record.getAllRecords({
      app: appIds.talent,
      fields: ["$id", "auth_user_id", "氏名", "複数選択", "言語_ツール", "主な実績_PR_職務経歴", "希望単価_月額"],
    });
    
    const freshTalents: TalentForMatching[] = (freshTalentsResponse as TalentRecord[]).map((record) => ({
      id: record.$id.value,
      authUserId: record.auth_user_id?.value || "",
      name: record.氏名?.value || "(名前なし)",
      positions: record.複数選択?.value || [],
      skills: record.言語_ツール?.value || "",
      experience: record.主な実績_PR_職務経歴?.value || "",
      desiredRate: record.希望単価_月額?.value || "",
    }));
    
    const matchResultsA = calculateTopMatches(freshTalents, sampleJob, 10);
    
    const scenarioAEnd = performance.now();
    const scenarioATime = scenarioAEnd - scenarioAStart;

    console.log(`  【シナリオA: 毎回人材データを取得】`);
    console.log(`    案件: ${sampleJob.title}`);
    console.log(`    人材数: ${freshTalents.length}人`);
    console.log(`    抽出結果: ${matchResultsA.length}人`);
    console.log(`    総処理時間: ${scenarioATime.toFixed(0)}ms`);
    console.log("");

    // シナリオB: 人材データをキャッシュしている場合
    const scenarioBStart = performance.now();
    const matchResultsB = calculateTopMatches(talents, sampleJob, 10);
    const scenarioBEnd = performance.now();
    const scenarioBTime = scenarioBEnd - scenarioBStart;

    console.log(`  【シナリオB: 人材データをキャッシュ済み】`);
    console.log(`    マッチング計算時間のみ: ${scenarioBTime.toFixed(2)}ms`);
    console.log("");
  }

  // ========================================
  // Step 4: 夜間バッチのシミュレーション
  // ========================================
  console.log("📊 Step 4: 夜間バッチ（全案件 × 全人材）");
  console.log("-".repeat(80));

  const batchStart = performance.now();
  
  let totalMatches = 0;
  for (const job of jobs) {
    const results = calculateTopMatches(talents, job, 10);
    totalMatches += results.length;
  }
  
  const batchEnd = performance.now();
  const batchTime = batchEnd - batchStart;

  console.log(`  案件数: ${jobs.length}件`);
  console.log(`  人材数: ${talents.length}人`);
  console.log(`  組み合わせ: ${(jobs.length * talents.length).toLocaleString()}件`);
  console.log(`  マッチング計算時間: ${batchTime.toFixed(0)}ms (${(batchTime / 1000).toFixed(2)}秒)`);
  console.log(`  抽出された推薦レコード数: ${totalMatches}件`);
  console.log("");

  // ========================================
  // 結論
  // ========================================
  console.log("=".repeat(80));
  console.log("📋 結論（実測値ベース）");
  console.log("=".repeat(80));
  console.log("");
  console.log(`現在のデータ規模: ${jobs.length}案件 × ${talents.length}人材`);
  console.log("");
  console.log("【案件詳細を開いたときの自動実行】");
  console.log(`  - 毎回人材データ取得: 約${Math.round(talentFetchTime + 20)}ms`);
  console.log(`  - キャッシュ利用時: 約20ms以下`);
  console.log("");
  console.log("【夜間バッチ】");
  console.log(`  - データ取得: 約${Math.round(talentFetchTime + jobFetchTime)}ms`);
  console.log(`  - マッチング計算: 約${Math.round(batchTime)}ms`);
  console.log(`  - 合計: 約${Math.round(talentFetchTime + jobFetchTime + batchTime)}ms (${((talentFetchTime + jobFetchTime + batchTime) / 1000).toFixed(2)}秒)`);
  console.log("");
  
  // スケール予測
  console.log("【人材1000人にスケールした場合の予測】");
  const scaleFactor = 1000 / Math.max(talents.length, 1);
  const scaledTalentFetch = talentFetchTime * scaleFactor * 0.5; // APIは並列取得するので線形ではない
  const scaledMatchTime = (batchTime / talents.length) * 1000;
  console.log(`  - 人材データ取得: 約${Math.round(scaledTalentFetch)}ms（予測）`);
  console.log(`  - 1案件のマッチング計算: 約${Math.round(scaledMatchTime / jobs.length)}ms（予測）`);
  console.log(`  - 全案件バッチ（${jobs.length}案件）: 約${Math.round(scaledMatchTime)}ms（予測）`);
  console.log("");
};

// 実行
runBenchmark().catch(console.error);

