/**
 * 推薦データ作成スクリプト
 * 
 * 案件と人材のマッチングスコアを計算し、推薦DBに登録する
 * 
 * 使用方法:
 *   npm run recommend:create
 */

// 環境変数を読み込む
import { config } from "dotenv";
config({ path: ".env.local" });

import { createTalentClient, createJobClient, createRecommendationClient, getAppIds } from "../lib/kintone/client";
import { RECOMMENDATION_FIELDS } from "../lib/kintone/fieldMapping";

// ========================================
// 型定義
// ========================================

type TalentRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  氏名: { value: string };
  複数選択: { value: string[] }; // 職種
  言語_ツール: { value: string };
  主な実績_PR_職務経歴: { value: string };
};

type JobRecord = {
  $id: { value: string };
  案件ID: { value: string }; // ルックアップ用のキーフィールド
  案件名: { value: string };
  職種_ポジション: { value: string[] };
  スキル: { value: string[] };
};

type RecommendationRecord = {
  $id: { value: string };
  人材ID: { value: string };
  案件ID: { value: string };
  適合スコア: { value: string };
};

type MatchResult = {
  talentId: string;        // 人材DBのレコード番号（$id）
  talentAuthUserId: string; // 人材DBのauth_user_id（推薦DBのルックアップ用）
  talentName: string;
  jobId: string;
  jobTitle: string;
  score: number;
  matchDetails: {
    keyword: string;
    count: number;
    source: string;
  }[];
};

// ========================================
// マッチングロジック
// ========================================

/**
 * テキスト内でキーワードが出現する回数をカウント
 * 大文字小文字を区別しない
 */
const countKeywordOccurrences = (text: string, keyword: string): number => {
  if (!text || !keyword) return 0;
  
  // 正規表現の特殊文字をエスケープ
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // 大文字小文字を区別しない検索
  const regex = new RegExp(escapedKeyword, 'gi');
  const matches = text.match(regex);
  
  return matches ? matches.length : 0;
};

/**
 * 人材と案件のマッチングスコアを計算
 * 
 * スコア計算ロジック:
 * 1. 案件の「職種_ポジション」と「スキル」から検索キーワードを抽出
 * 2. 人材の「職種」「言語_ツール」「主な実績_PR_職務経歴」でキーワードの出現回数をカウント
 * 3. 全キーワードの出現回数を合計してスコアとする
 */
const calculateMatchScore = (talent: TalentRecord, job: JobRecord): MatchResult => {
  const matchDetails: MatchResult["matchDetails"] = [];
  let totalScore = 0;

  // 検索対象のキーワードを収集（職種_ポジション + スキル）
  const keywords: string[] = [
    ...(job.職種_ポジション?.value || []),
    ...(job.スキル?.value || []),
  ];

  // 人材の検索対象テキストを準備
  const talentTexts = {
    職種: (talent.複数選択?.value || []).join(" "),
    言語_ツール: talent.言語_ツール?.value || "",
    主な実績_PR_職務経歴: talent.主な実績_PR_職務経歴?.value || "",
  };

  // 各キーワードについてマッチングを実行
  for (const keyword of keywords) {
    let keywordTotal = 0;
    const sources: string[] = [];

    // 各テキストフィールドでキーワードをカウント
    for (const [fieldName, text] of Object.entries(talentTexts)) {
      const count = countKeywordOccurrences(text, keyword);
      if (count > 0) {
        keywordTotal += count;
        sources.push(`${fieldName}(${count})`);
      }
    }

    if (keywordTotal > 0) {
      matchDetails.push({
        keyword,
        count: keywordTotal,
        source: sources.join(", "),
      });
      totalScore += keywordTotal;
    }
  }

  return {
    talentId: talent.$id.value,
    talentAuthUserId: talent.auth_user_id?.value || "",
    talentName: talent.氏名?.value || "(名前なし)",
    jobId: job.案件ID?.value || job.$id.value, // ルックアップ用に「案件ID」フィールドを使用
    jobTitle: job.案件名?.value || "(案件名なし)",
    score: totalScore,
    matchDetails,
  };
};

// ========================================
// メイン処理
// ========================================

const createRecommendations = async () => {
  console.log("\n🎯 推薦データを作成します\n");

  try {
    const appIds = getAppIds();

    // 推薦DBが設定されているか確認
    if (!appIds.recommendation) {
      console.error("❌ KINTONE_RECOMMENDATION_APP_ID が設定されていません");
      console.error("   .env.local に以下を追加してください:");
      console.error("   KINTONE_RECOMMENDATION_APP_ID=97");
      console.error("   KINTONE_RECOMMENDATION_API_TOKEN=your_token");
      process.exit(1);
    }

    const talentClient = createTalentClient();
    const jobClient = createJobClient();
    const recommendationClient = createRecommendationClient();

    // 1. 全人材を取得
    console.log("=".repeat(80));
    console.log("👨‍💼 Step 1: 人材データを取得");
    console.log("=".repeat(80));

    const talentsResponse = await talentClient.record.getAllRecords({
      app: appIds.talent,
      fields: ["$id", "auth_user_id", "氏名", "複数選択", "言語_ツール", "主な実績_PR_職務経歴"],
    });
    const talents = talentsResponse as TalentRecord[];
    console.log(`✅ 人材データ取得完了: ${talents.length}件`);

    // 2. 全案件を取得
    console.log("\n" + "=".repeat(80));
    console.log("💼 Step 2: 案件データを取得");
    console.log("=".repeat(80));

    const jobsResponse = await jobClient.record.getAllRecords({
      app: appIds.job,
      fields: ["$id", "案件ID", "案件名", "職種_ポジション", "スキル"],
    });
    const jobs = jobsResponse as JobRecord[];
    console.log(`✅ 案件データ取得完了: ${jobs.length}件`);

    // 3. 既存の推薦データを取得
    console.log("\n" + "=".repeat(80));
    console.log("📋 Step 3: 既存の推薦データを取得");
    console.log("=".repeat(80));

    const existingRecsResponse = await recommendationClient.record.getAllRecords({
      app: appIds.recommendation,
      fields: ["$id", "人材ID", "案件ID", "適合スコア"],
    });
    const existingRecs = existingRecsResponse as RecommendationRecord[];
    console.log(`✅ 既存推薦データ取得完了: ${existingRecs.length}件`);

    // 既存データをMapに変換（キー: "auth_user_id_案件ID"）
    const existingRecsMap = new Map<string, string>();
    for (const rec of existingRecs) {
      const key = `${rec.人材ID.value}_${rec.案件ID.value}`;
      existingRecsMap.set(key, rec.$id.value);
    }

    // 4. マッチングスコアを計算
    console.log("\n" + "=".repeat(80));
    console.log("🔢 Step 4: マッチングスコアを計算");
    console.log("=".repeat(80));

    const matchResults: MatchResult[] = [];
    const totalCombinations = talents.length * jobs.length;
    let processedCount = 0;

    for (const job of jobs) {
      console.log(`\n📌 案件: ${job.案件名?.value || "(案件名なし)"}`);
      console.log(`   職種: ${(job.職種_ポジション?.value || []).join(", ") || "(未設定)"}`);
      console.log(`   スキル: ${(job.スキル?.value || []).join(", ") || "(未設定)"}`);

      for (const talent of talents) {
        const result = calculateMatchScore(talent, job);
        matchResults.push(result);
        processedCount++;

        // スコアが0より大きい場合のみ詳細を表示
        if (result.score > 0) {
          console.log(`   → ${result.talentName}: スコア ${result.score}`);
          for (const detail of result.matchDetails) {
            console.log(`      - "${detail.keyword}": ${detail.count}回 [${detail.source}]`);
          }
        }
      }
    }

    console.log(`\n✅ マッチング計算完了: ${processedCount}件`);

    // 5. 推薦DBにレコードを登録/更新
    console.log("\n" + "=".repeat(80));
    console.log("💾 Step 5: 推薦DBに登録/更新");
    console.log("=".repeat(80));

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const result of matchResults) {
      // auth_user_idがない人材はスキップ
      if (!result.talentAuthUserId) {
        console.log(`   ⚠️ ${result.talentName}: auth_user_idがないためスキップ`);
        skippedCount++;
        continue;
      }

      const key = `${result.talentAuthUserId}_${result.jobId}`;
      const existingRecId = existingRecsMap.get(key);

      if (existingRecId) {
        // 既存レコードを更新
        await recommendationClient.record.updateRecord({
          app: appIds.recommendation,
          id: existingRecId,
          record: {
            [RECOMMENDATION_FIELDS.SCORE]: { value: result.score },
          },
        });
        updatedCount++;
      } else {
        // 新規レコードを作成（人材IDはauth_user_idを使用）
        await recommendationClient.record.addRecord({
          app: appIds.recommendation,
          record: {
            [RECOMMENDATION_FIELDS.TALENT_ID]: { value: result.talentAuthUserId },
            [RECOMMENDATION_FIELDS.JOB_ID]: { value: result.jobId },
            [RECOMMENDATION_FIELDS.SCORE]: { value: result.score },
          },
        });
        createdCount++;
      }
    }

    // 6. 結果サマリを表示
    console.log("\n" + "=".repeat(80));
    console.log("🎉 推薦データの作成が完了しました！");
    console.log("=".repeat(80));
    console.log("\n📊 処理結果:");
    console.log(`   👨‍💼 人材数: ${talents.length}件`);
    console.log(`   💼 案件数: ${jobs.length}件`);
    console.log(`   🔢 マッチング組み合わせ: ${matchResults.length}件`);
    console.log(`   ✨ 新規作成: ${createdCount}件`);
    console.log(`   🔄 更新: ${updatedCount}件`);
    if (skippedCount > 0) {
      console.log(`   ⏭️ スキップ: ${skippedCount}件`);
    }

    // スコア上位の組み合わせを表示
    const topResults = [...matchResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (topResults.length > 0 && topResults[0].score > 0) {
      console.log("\n🏆 スコア上位10件:");
      for (let i = 0; i < topResults.length; i++) {
        const r = topResults[i];
        if (r.score === 0) break;
        console.log(`   ${i + 1}. ${r.talentName} × ${r.jobTitle} = ${r.score}点`);
      }
    }

    console.log("\n");

  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
      console.error("スタックトレース:", error.stack);
    }
    process.exit(1);
  }
};

// 実行
createRecommendations();

