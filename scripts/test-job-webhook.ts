/**
 * 案件作成Webhook テストスクリプト
 *
 * テスト案件を作成し、Webhookを呼び出して推薦レコードを作成する
 *
 * 使用方法:
 *   npm run test:webhook
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createJobClient, getAppIds } from "../lib/kintone/client";
import { JOB_FIELDS } from "../lib/kintone/fieldMapping";

const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const WEBHOOK_SECRET = process.env.KINTONE_WEBHOOK_SECRET;

async function main() {
  console.log("テスト案件を作成中...");

  const jobClient = createJobClient();
  const appIds = getAppIds();

  // テスト案件を作成
  const testJob = {
    [JOB_FIELDS.TITLE]: { value: `[テスト案件] ${new Date().toLocaleString("ja-JP")}` },
    [JOB_FIELDS.POSITION]: { value: ["バックエンドエンジニア", "フロントエンドエンジニア"] },
    [JOB_FIELDS.SKILLS]: { value: ["TypeScript", "Node.js", "React", "Next.js"] },
    [JOB_FIELDS.RECRUITMENT_STATUS]: { value: "募集中" },
    [JOB_FIELDS.LISTING_STATUS]: { value: "有" },
  };

  const response = await jobClient.record.addRecord({
    app: appIds.job,
    record: testJob,
  });

  const jobId = String(response.id);
  console.log(`✅ 案件作成完了: ID=${jobId}`);

  // Webhookを呼び出し
  console.log("Webhookを呼び出し中...");

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (WEBHOOK_SECRET) {
    headers["X-Webhook-Secret"] = WEBHOOK_SECRET;
  }

  const webhookResponse = await fetch(`${WEBHOOK_URL}/api/webhooks/job-created`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "ADD_RECORD",
      app: { id: String(appIds.job), name: "案件DB" },
      record: {
        $id: { value: jobId },
        ...testJob,
      },
    }),
  });

  const result = await webhookResponse.json();

  if (result.success) {
    console.log(`✅ 推薦レコード作成: ${result.stats?.created ?? 0}件`);
    console.log(`   閾値: ${result.threshold}`);
  } else {
    console.log(`❌ エラー: ${result.error}`);
  }
}

main().catch(console.error);
