/**
 * Lambda用 Slack通知ユーティリティ
 *
 * Secrets Managerから Webhook URLを取得して通知を送信
 */

import { getLambdaSecrets } from "./secrets";

type SlackBlock = {
  type: "section" | "divider" | "header" | "context";
  text?: { type: "mrkdwn" | "plain_text"; text: string };
  fields?: Array<{ type: "mrkdwn" | "plain_text"; text: string }>;
};

type SlackMessage = {
  text: string;
  blocks?: SlackBlock[];
};

/**
 * Slack Webhook URLを取得（Secrets Manager経由）
 */
const getSlackWebhookUrl = async (): Promise<string> => {
  const secrets = await getLambdaSecrets();
  if (!secrets.slackWebhookUrl) {
    throw new Error("SLACK_WEBHOOK_URL is not configured in Secrets Manager");
  }
  return secrets.slackWebhookUrl;
};

/**
 * Slackにメッセージを送信
 */
export const sendSlackMessage = async (message: SlackMessage): Promise<void> => {
  const webhookUrl = await getSlackWebhookUrl();

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status}`);
  }

  console.log("✅ Slack通知送信成功");
};

/**
 * 面談リマインド通知を送信
 */
export const sendInterviewReminderNotification = async (data: {
  interviews: Array<{
    talentName: string;
    jobTitle: string;
  }>;
  dateStr: string;
}): Promise<void> => {
  if (data.interviews.length === 0) {
    console.log("面談予定なし、通知をスキップ");
    return;
  }

  const interviewList = data.interviews
    .map((i) => `• ${i.talentName} 様 / ${i.jobTitle}`)
    .join("\n");

  const message: SlackMessage = {
    text: `【面談リマインド】明日の面談予定: ${data.interviews.length}件`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📅 明日の面談予定" },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*日付:* ${data.dateStr}\n*面談件数:* ${data.interviews.length}件\n\n${interviewList}`,
        },
      },
    ],
  };

  await sendSlackMessage(message);
};
