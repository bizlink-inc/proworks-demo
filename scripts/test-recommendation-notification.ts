/**
 * 推薦通知テストスクリプト
 *
 * 山田太郎と山田太郎2に対して推薦レコードを直接作成し、
 * アプリ内通知が表示されるかテストする
 *
 * 使用方法:
 *   npm run test:recommend-notification
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createJobClient, createRecommendationClient, getAppIds } from "../lib/kintone/client";
import { RECOMMENDATION_FIELDS, JOB_FIELDS } from "../lib/kintone/fieldMapping";

// シードデータと同じユーザーID
const YAMADA_AUTH_USER_ID = "cm4wam5lq0000lhahk2ymsr5p";
const YAMADA2_AUTH_USER_ID = "cm5jyqp2d0000l5puzqgmf8mc";

type JobRecord = {
  $id: { value: string };
  案件名: { value: string };
};

type RecommendationRecord = {
  $id: { value: string };
  人材ID: { value: string };
  案件ID: { value: string };
};

async function main() {
  console.log("🔔 推薦通知テスト");
  console.log("=".repeat(60));

  const appIds = getAppIds();
  const jobClient = createJobClient();
  const recommendationClient = createRecommendationClient();

  // 1. 募集中の案件を1件取得
  console.log("\n📋 募集中の案件を取得...");
  const jobsResponse = await jobClient.record.getRecords({
    app: appIds.job,
    query: `${JOB_FIELDS.RECRUITMENT_STATUS} in ("募集中") and ${JOB_FIELDS.LISTING_STATUS} in ("有") limit 1`,
    fields: ["$id", JOB_FIELDS.TITLE],
  });

  const jobs = jobsResponse.records as unknown as JobRecord[];
  if (jobs.length === 0) {
    console.log("❌ 募集中の案件がありません");
    return;
  }

  const job = jobs[0];
  const jobId = job.$id.value;
  const jobTitle = job.案件名?.value || "(案件名なし)";
  console.log(`   案件: ${jobTitle} (ID: ${jobId})`);

  // 2. 既存の推薦レコードを確認
  console.log("\n🔍 既存の推薦レコードを確認...");
  const targetUsers = [
    { id: YAMADA_AUTH_USER_ID, name: "山田太郎" },
    { id: YAMADA2_AUTH_USER_ID, name: "山田太郎2" },
  ];

  const existingRecsResponse = await recommendationClient.record.getAllRecords({
    app: appIds.recommendation,
    condition: `${RECOMMENDATION_FIELDS.JOB_ID} = "${jobId}" and (${RECOMMENDATION_FIELDS.TALENT_ID} = "${YAMADA_AUTH_USER_ID}" or ${RECOMMENDATION_FIELDS.TALENT_ID} = "${YAMADA2_AUTH_USER_ID}")`,
    fields: ["$id", RECOMMENDATION_FIELDS.TALENT_ID, RECOMMENDATION_FIELDS.JOB_ID],
  });

  const existingRecs = existingRecsResponse as unknown as RecommendationRecord[];
  const existingTalentIds = new Set(existingRecs.map((r) => r.人材ID.value));

  // 3. 推薦レコードを作成
  console.log("\n✨ 推薦レコードを作成...");
  let created = 0;
  let skipped = 0;

  for (const user of targetUsers) {
    if (existingTalentIds.has(user.id)) {
      console.log(`   ⏭️  ${user.name}: 既存レコードあり（スキップ）`);
      skipped++;
      continue;
    }

    await recommendationClient.record.addRecord({
      app: appIds.recommendation,
      record: {
        [RECOMMENDATION_FIELDS.TALENT_ID]: { value: user.id },
        [RECOMMENDATION_FIELDS.JOB_ID]: { value: jobId },
        [RECOMMENDATION_FIELDS.SCORE]: { value: 10 }, // テスト用スコア
      },
    });
    console.log(`   ✅ ${user.name}: 推薦レコード作成`);
    created++;
  }

  console.log("\n" + "=".repeat(60));
  console.log(`🎉 完了: 作成=${created}件, スキップ=${skipped}件`);
  console.log("\n📌 次のステップ:");
  console.log("   1. ブラウザでlocalStorageの 'read_recommended_notifications' を削除");
  console.log("   2. 山田太郎または山田太郎2でログイン");
  console.log("   3. ベルアイコンに通知が表示されることを確認");
}

main().catch(console.error);
