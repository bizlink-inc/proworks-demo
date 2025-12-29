#!/usr/bin/env npx ts-node
/**
 * Slack Webhook 動作確認スクリプト
 *
 * 使用方法:
 *   npx ts-node scripts/test-slack-webhook.ts <WEBHOOK_URL>
 *
 * 例:
 *   npx ts-node scripts/test-slack-webhook.ts https://hooks.slack.com/services/xxx/yyy/zzz
 */

const WEBHOOK_URL = process.argv[2];

if (!WEBHOOK_URL) {
  console.error("❌ エラー: Webhook URLを指定してください");
  console.error("");
  console.error("使用方法:");
  console.error("  npx ts-node scripts/test-slack-webhook.ts <WEBHOOK_URL>");
  console.error("");
  console.error("例:");
  console.error("  npx ts-node scripts/test-slack-webhook.ts https://hooks.slack.com/services/xxx/yyy/zzz");
  process.exit(1);
}

if (!WEBHOOK_URL.startsWith("https://hooks.slack.com/")) {
  console.error("❌ エラー: 有効なSlack Webhook URLを指定してください");
  console.error("   URLは https://hooks.slack.com/ で始まる必要があります");
  process.exit(1);
}

async function testWebhook() {
  console.log("🔍 Slack Webhook テスト開始...");
  console.log(`   URL: ${WEBHOOK_URL.substring(0, 50)}...`);
  console.log("");

  const now = new Date();
  const jstTime = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  const testMessage = {
    text: "【テスト通知】PRO WORKS Slack連携テスト",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🔔 PRO WORKS Slack連携テスト",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "このメッセージが表示されていれば、Webhook連携は正常に動作しています。",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*送信日時:*\n${jstTime}`,
          },
          {
            type: "mrkdwn",
            text: "*ステータス:*\n✅ 接続成功",
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "PRO WORKS 通知システム - ヘルスチェック",
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testMessage),
    });

    if (response.ok) {
      console.log("✅ テスト成功！");
      console.log("   Slackチャンネルにテスト通知が送信されました。");
      console.log("   チャンネルを確認してください。");
      process.exit(0);
    } else {
      const errorText = await response.text();
      console.error(`❌ テスト失敗: HTTP ${response.status}`);
      console.error(`   レスポンス: ${errorText}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ テスト失敗: ネットワークエラー");
    console.error(`   ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

testWebhook();
