/**
 * InterviewReminder Lambda関数
 *
 * 毎日JST 10:00に実行され、翌日の面談予定をSlackに通知
 * 設定値はSecrets Managerから取得
 */

import { Handler } from "aws-lambda";
import {
  createApplicationClientAsync,
  createTalentClientAsync,
  getAppIdsAsync,
  APPLICATION_FIELDS,
  TALENT_FIELDS,
} from "../../shared/kintone";
import { sendInterviewReminderNotification } from "../../shared/slack";

interface InterviewInfo {
  talentName: string;
  jobTitle: string;
  authUserId: string;
}

interface InterviewReminderOutput {
  success: boolean;
  interviewCount: number;
  interviews: InterviewInfo[];
}

export const handler: Handler<Record<string, never>, InterviewReminderOutput> = async () => {
  console.log("InterviewReminder Lambda開始");
  const startTime = Date.now();

  try {
    // Secrets Managerから設定を取得してクライアントを作成
    const [applicationClient, talentClient, appIds] = await Promise.all([
      createApplicationClientAsync(),
      createTalentClientAsync(),
      getAppIdsAsync(),
    ]);

    // 翌日の日付を計算（JST）
    const now = new Date();
    // JSTに変換（UTC+9）
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstNow = new Date(now.getTime() + jstOffset);
    const jstTomorrow = new Date(jstNow);
    jstTomorrow.setDate(jstTomorrow.getDate() + 1);

    // YYYY-MM-DD形式
    const tomorrowStr = jstTomorrow.toISOString().split("T")[0];
    console.log(`翌日の日付: ${tomorrowStr}`);

    // kintoneから「面談予定」ステータス + 翌日の面談日のレコードを取得
    console.log("面談予定レコードを取得中...");
    const records = await applicationClient.record.getAllRecords({
      app: appIds.application!,
      condition: `${APPLICATION_FIELDS.STATUS} = "面談予定" and ${APPLICATION_FIELDS.INTERVIEW_DATE} = "${tomorrowStr}"`,
    });

    console.log(`明日の面談予定: ${records.length}件`);

    if (records.length === 0) {
      console.log("面談予定なし、処理終了");
      return {
        success: true,
        interviewCount: 0,
        interviews: [],
      };
    }

    // auth_user_idのリストを取得
    const authUserIds = records.map(
      (record) => String(record[APPLICATION_FIELDS.AUTH_USER_ID]?.value || "")
    ).filter(Boolean);

    // 人材情報を取得して名前を取得
    const talentMap = new Map<string, string>();
    if (authUserIds.length > 0) {
      const uniqueIds = [...new Set(authUserIds)];
      const talentCondition = uniqueIds
        .map((id) => `${TALENT_FIELDS.AUTH_USER_ID} = "${id}"`)
        .join(" or ");

      const talentRecords = await talentClient.record.getAllRecords({
        app: appIds.talent,
        condition: talentCondition,
      });

      for (const talent of talentRecords) {
        const authUserId = String(talent[TALENT_FIELDS.AUTH_USER_ID]?.value || "");
        const name = String(talent[TALENT_FIELDS.FULL_NAME]?.value || "不明");
        talentMap.set(authUserId, name);
      }
    }

    // 面談情報を整形
    const interviews: InterviewInfo[] = records.map((record) => {
      const authUserId = String(record[APPLICATION_FIELDS.AUTH_USER_ID]?.value || "");
      return {
        authUserId,
        talentName: talentMap.get(authUserId) || "不明",
        jobTitle: String(record[APPLICATION_FIELDS.JOB_TITLE]?.value || "不明"),
      };
    });

    // Slack通知を送信
    await sendInterviewReminderNotification({
      interviews,
      dateStr: tomorrowStr,
    });

    const elapsedMs = Date.now() - startTime;
    console.log(`InterviewReminder Lambda完了 (${elapsedMs}ms)`);

    return {
      success: true,
      interviewCount: interviews.length,
      interviews,
    };
  } catch (error) {
    console.error("InterviewReminder Lambdaエラー:", error);
    throw error;
  }
};
