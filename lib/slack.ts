/**
 * Slack通知ユーティリティ（Incoming Webhook方式）
 *
 * - 開発環境: コンソールに出力
 * - 本番環境: Slack Incoming Webhook で送信
 *
 * @see lib/email.ts - 参考にした既存のメール送信ユーティリティ
 */

// 環境判定（動的に評価するため関数化）
const isDevelopment = () => process.env.NODE_ENV === "development";

// Webhook URL取得
const getWebhookUrl = (): string | null => {
  return process.env.SLACK_WEBHOOK_URL || null;
};

/**
 * kintoneレコードURLを生成
 */
const getKintoneRecordUrl = (appType: "talent" | "job", recordId: string): string => {
  const baseUrl = process.env.KINTONE_BASE_URL || "";
  const appId =
    appType === "talent"
      ? process.env.KINTONE_TALENT_APP_ID
      : process.env.KINTONE_JOB_APP_ID;

  if (!baseUrl || !appId || !recordId) {
    return "";
  }

  return `${baseUrl}/k/${appId}/show#record=${recordId}`;
};

// Slack送信結果の型
type SendSlackResult = {
  success: boolean;
  error?: string;
};

// Slackメッセージブロック型定義
type SlackBlock = {
  type: "section" | "divider" | "header" | "context";
  text?: {
    type: "mrkdwn" | "plain_text";
    text: string;
  };
  fields?: Array<{
    type: "mrkdwn" | "plain_text";
    text: string;
  }>;
};

type SlackMessage = {
  text: string; // フォールバックテキスト
  blocks?: SlackBlock[];
};

/**
 * Slack通知を送信（内部関数）
 * 開発環境ではコンソール出力、本番環境ではWebhookで送信
 */
const sendSlackNotification = async (
  message: SlackMessage
): Promise<SendSlackResult> => {
  // 開発環境: コンソールに出力
  if (isDevelopment()) {
    console.log("\n" + "=".repeat(80));
    console.log("📢 [Slack通知 - 開発環境]");
    console.log("=".repeat(80));
    console.log(message.text);
    if (message.blocks) {
      console.log("\n[Blocks]");
      message.blocks.forEach((block) => {
        if (block.type === "header" && block.text) {
          console.log(`\n### ${block.text.text}`);
        } else if (block.type === "section") {
          if (block.text) {
            console.log(block.text.text);
          }
          if (block.fields) {
            block.fields.forEach((field) => {
              console.log(field.text.replace(/\*/g, ""));
            });
          }
        }
      });
    }
    console.log("=".repeat(80) + "\n");
    return { success: true };
  }

  // 本番環境: Webhook送信
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.warn("⚠️ SLACK_WEBHOOK_URL が設定されていません");
    return { success: false, error: "Webhook URLが設定されていません" };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    console.log("✅ Slack通知送信成功");
    return { success: true };
  } catch (error: unknown) {
    console.error("❌ Slack通知送信エラー:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "送信に失敗しました",
    };
  }
};

/**
 * 日時をJST形式でフォーマット
 */
const formatJSTDateTime = (date: Date = new Date()): string => {
  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * 新規登録通知
 */
export const sendNewUserNotification = async (data: {
  fullName: string;
  email: string;
  phone: string;
  talentRecordId?: string;
  registeredAt?: string;
}): Promise<SendSlackResult> => {
  const registeredAt = data.registeredAt || formatJSTDateTime();
  const talentUrl = data.talentRecordId
    ? getKintoneRecordUrl("talent", data.talentRecordId)
    : "";

  const message: SlackMessage = {
    text: `【新規登録】${data.fullName} 様が会員登録しました`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🆕 新規会員登録" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*氏名:*\n${data.fullName}` },
          { type: "mrkdwn", text: `*メールアドレス:*\n${data.email}` },
          { type: "mrkdwn", text: `*電話番号:*\n${data.phone || "未登録"}` },
          { type: "mrkdwn", text: `*登録日時:*\n${registeredAt}` },
        ],
      },
      ...(talentUrl
        ? [
            {
              type: "section" as const,
              text: {
                type: "mrkdwn" as const,
                text: `<${talentUrl}|📋 人材DBで確認>`,
              },
            },
          ]
        : []),
    ],
  };
  return sendSlackNotification(message);
};

/**
 * プロフィール完成通知
 */
export const sendProfileCompleteNotification = async (data: {
  fullName: string;
  email: string;
  talentRecordId?: string;
}): Promise<SendSlackResult> => {
  const talentUrl = data.talentRecordId
    ? getKintoneRecordUrl("talent", data.talentRecordId)
    : "";

  const message: SlackMessage = {
    text: `【プロフィール完成】${data.fullName} 様がプロフィールを完成しました`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "✅ プロフィール完成" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*氏名:*\n${data.fullName}` },
          { type: "mrkdwn", text: `*メールアドレス:*\n${data.email}` },
        ],
      },
      ...(talentUrl
        ? [
            {
              type: "section" as const,
              text: {
                type: "mrkdwn" as const,
                text: `<${talentUrl}|📋 人材DBで確認>`,
              },
            },
          ]
        : []),
    ],
  };
  return sendSlackNotification(message);
};

/**
 * 応募通知
 */
export const sendApplicationNotification = async (data: {
  fullName: string;
  jobTitle: string;
  jobId: string;
  talentRecordId?: string;
  jobRecordId?: string;
}): Promise<SendSlackResult> => {
  const talentUrl = data.talentRecordId
    ? getKintoneRecordUrl("talent", data.talentRecordId)
    : "";
  const jobUrl = data.jobRecordId
    ? getKintoneRecordUrl("job", data.jobRecordId)
    : "";

  // リンクセクションを構築
  const linkTexts: string[] = [];
  if (talentUrl) {
    linkTexts.push(`<${talentUrl}|📋 人材DBで確認>`);
  }
  if (jobUrl) {
    linkTexts.push(`<${jobUrl}|💼 案件DBで確認>`);
  }

  const message: SlackMessage = {
    text: `【案件応募】${data.fullName} 様が「${data.jobTitle}」に応募しました`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📝 案件応募" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*氏名:*\n${data.fullName}` },
          { type: "mrkdwn", text: `*案件タイトル:*\n${data.jobTitle}` },
        ],
      },
      ...(linkTexts.length > 0
        ? [
            {
              type: "section" as const,
              text: {
                type: "mrkdwn" as const,
                text: linkTexts.join("　"),
              },
            },
          ]
        : []),
    ],
  };
  return sendSlackNotification(message);
};

/**
 * 面談リマインド通知（Lambda用）
 */
export const sendInterviewReminderNotification = async (data: {
  interviews: Array<{
    talentName: string;
    jobTitle: string;
    interviewDate: string;
  }>;
}): Promise<SendSlackResult> => {
  if (data.interviews.length === 0) {
    return { success: true }; // 面談がない場合は何もしない
  }

  const interviewList = data.interviews
    .map((i) => `• ${i.talentName} 様 / ${i.jobTitle}`)
    .join("\n");

  // 翌日の日付を取得
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

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
          text: `*日付:* ${dateStr}\n*面談件数:* ${data.interviews.length}件\n\n${interviewList}`,
        },
      },
    ],
  };
  return sendSlackNotification(message);
};
