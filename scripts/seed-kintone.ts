/**
 * kintone書き込み処理
 */

import {
  createTalentClient,
  createJobClient,
  createApplicationClient,
  createRecommendationClient,
  createAnnouncementClient,
  createInquiryClient,
  getAppIds,
} from "../lib/kintone/client";
import {
  TALENT_FIELDS,
  RECOMMENDATION_FIELDS,
  APPLICATION_FIELDS,
} from "../lib/kintone/fieldMapping";
import { formatDate } from "./seed-utils";
import { buildAnnouncementRecord } from "./seed-record-builders";

/** レコードを一括追加 */
export const addTalentRecords = async (records: any[]): Promise<string[]> => {
  const appIds = getAppIds();
  const client = createTalentClient();
  const result = await client.record.addRecords({
    app: appIds.talent,
    records,
  });
  return result.ids;
};

/** 案件レコードを一括追加 */
export const addJobRecords = async (records: any[]): Promise<string[]> => {
  const appIds = getAppIds();
  const client = createJobClient();
  const result = await client.record.addRecords({
    app: appIds.job,
    records: records as any,
  });
  return result.ids;
};

/** 応募レコードを一括追加 */
export const addApplicationRecords = async (records: any[]): Promise<string[]> => {
  if (records.length === 0) return [];
  const appIds = getAppIds();
  const client = createApplicationClient();
  const result = await client.record.addRecords({
    app: appIds.application,
    records,
  });
  return result.ids;
};

/** 推薦レコードを一括追加（並列バッチ処理） */
export const addRecommendationRecordsInBatches = async (
  records: any[],
  batchSize: number = 100
): Promise<void> => {
  if (records.length === 0) return;
  const appIds = getAppIds();
  const client = createRecommendationClient();

  // バッチに分割
  const batches: any[][] = [];
  for (let i = 0; i < records.length; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }

  // 全バッチを並列で追加
  await Promise.all(
    batches.map((batch) =>
      client.record.addRecords({
        app: appIds.recommendation,
        records: batch,
      })
    )
  );
};

/** お知らせレコードを作成 */
export const createAnnouncementRecords = async (): Promise<number> => {
  const appIds = getAppIds();
  if (!appIds.announcement) {
    console.log(`   → スキップ（App ID未設定）`);
    return 0;
  }

  try {
    const client = createAnnouncementClient();
    const today = new Date();
    const oneMonthLater = new Date(today);
    oneMonthLater.setMonth(today.getMonth() + 1);

    const todayStr = formatDate(today);
    const oneMonthLaterStr = formatDate(oneMonthLater);

    const records = [
      buildAnnouncementRecord(
        "お知らせ",
        todayStr,
        oneMonthLaterStr,
        "システムの新機能が追加されました。詳細はこちらをご確認ください。"
      ),
      buildAnnouncementRecord(
        "メンテナンス",
        todayStr,
        oneMonthLaterStr,
        "来週のメンテナンス作業についてお知らせします。作業時間中はサービスが一時的に利用できなくなります。"
      ),
      buildAnnouncementRecord(
        "お知らせ",
        todayStr,
        oneMonthLaterStr,
        "年末年始の営業時間についてお知らせします。12月29日から1月3日まで休業となります。"
      ),
      buildAnnouncementRecord(
        "障害",
        todayStr,
        oneMonthLaterStr,
        "現在、一部機能で不具合が発生している可能性があります。復旧作業を進めております。"
      ),
    ];

    await client.record.addRecords({
      app: appIds.announcement,
      records,
    });

    return records.length;
  } catch {
    console.log(`   → スキップ（App ID未設定またはエラー）`);
    return 0;
  }
};

/** 推薦レコードをUpsert */
export const upsertRecommendationRecords = async (
  talentId: string,
  records: any[]
): Promise<{ updated: number; added: number }> => {
  if (records.length === 0) return { updated: 0, added: 0 };

  const appIds = getAppIds();
  const client = createRecommendationClient();

  // 既存レコードを取得
  const existingRecs = await client.record.getAllRecords({
    app: appIds.recommendation,
    condition: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${talentId}"`,
  });

  const existingMap = new Map<string, string>();
  for (const rec of existingRecs as any[]) {
    existingMap.set(rec[RECOMMENDATION_FIELDS.JOB_ID].value, rec.$id.value);
  }

  // 更新と追加を分離
  const toUpdate: any[] = [];
  const toAdd: any[] = [];

  for (const rec of records) {
    const jobId = rec[RECOMMENDATION_FIELDS.JOB_ID].value;
    const existingId = existingMap.get(jobId);
    if (existingId) {
      toUpdate.push({ id: existingId, record: rec });
    } else {
      toAdd.push(rec);
    }
  }

  // 一括更新
  if (toUpdate.length > 0) {
    await client.record.updateRecords({
      app: appIds.recommendation,
      records: toUpdate,
    });
  }

  // 一括追加
  if (toAdd.length > 0) {
    await client.record.addRecords({
      app: appIds.recommendation,
      records: toAdd,
    });
  }

  return { updated: toUpdate.length, added: toAdd.length };
};

/** 単一テーブルの全レコードを取得して削除 */
const fetchAndDeleteAll = async (
  client: any,
  appId: string | number | undefined,
  optional: boolean = false
): Promise<number> => {
  if (!appId) return 0;
  try {
    const records = await client.record.getAllRecords({
      app: appId,
      fields: ["$id"],
    });
    if (records.length > 0) {
      const ids = records.map((r: any) => r.$id.value);
      await deleteInBatches(client, appId, ids);
      return ids.length;
    }
    return 0;
  } catch {
    if (optional) return 0;
    throw new Error(`Failed to delete records from app ${appId}`);
  }
};

/** 全レコードを削除（並列処理） */
export const deleteAllRecords = async (): Promise<{
  recommendation: number;
  application: number;
  job: number;
  talent: number;
  announcement: number;
}> => {
  const appIds = getAppIds();

  // 全テーブルを並列で取得・削除
  const [recommendation, application, job, talent, announcement] = await Promise.all([
    fetchAndDeleteAll(createRecommendationClient(), appIds.recommendation, true),
    fetchAndDeleteAll(createApplicationClient(), appIds.application, false),
    fetchAndDeleteAll(createJobClient(), appIds.job, false),
    fetchAndDeleteAll(createTalentClient(), appIds.talent, false),
    fetchAndDeleteAll(createAnnouncementClient(), appIds.announcement, true),
  ]);

  return { recommendation, application, job, talent, announcement };
};

/** バッチ削除 */
const deleteInBatches = async (
  client: any,
  appId: string | number,
  ids: string[],
  batchSize: number = 100
): Promise<void> => {
  const numericAppId = typeof appId === "string" ? parseInt(appId, 10) : appId;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize).map((id) => parseInt(id, 10));
    await client.record.deleteRecords({
      app: numericAppId,
      ids: batch,
    });
  }
};

/** 問い合わせDBを削除 */
export const deleteInquiryRecords = async (): Promise<number> => {
  const appIds = getAppIds();
  if (!appIds.inquiry) {
    console.log("⚠️ 問い合わせ・退会DBのApp IDが設定されていません");
    return 0;
  }

  try {
    const client = createInquiryClient();
    const records = await client.record.getAllRecords({
      app: appIds.inquiry,
    });

    if (records.length > 0) {
      const ids = records.map((r: any) => r.$id.value);
      await client.record.deleteRecords({
        app: appIds.inquiry,
        ids: ids.map((id: string) => parseInt(id, 10)),
      });
      console.log(`✅ 問い合わせ・退会DB: ${ids.length}件のレコードを削除しました`);
      return ids.length;
    }

    console.log("✅ 問い合わせ・退会DB: 削除するレコードはありません");
    return 0;
  } catch (error) {
    console.error("⚠️ 問い合わせ・退会DBのクリーンアップに失敗:", error);
    return 0;
  }
};

/** 人材の退会ステータスをリセット */
export const resetTalentWithdrawalStatus = async (
  authUserId: string
): Promise<void> => {
  const appIds = getAppIds();
  const client = createTalentClient();

  try {
    const existingTalent = await client.record.getAllRecords({
      app: appIds.talent,
      condition: `${TALENT_FIELDS.AUTH_USER_ID} = "${authUserId}"`,
    });

    if (existingTalent.length > 0) {
      const recordId = (existingTalent[0] as any).$id.value;
      const currentST = (existingTalent[0] as any)[TALENT_FIELDS.ST]?.value || "";

      if (currentST === "退会") {
        await client.record.updateRecord({
          app: appIds.talent,
          id: recordId,
          record: {
            [TALENT_FIELDS.ST]: { value: "" },
          },
        });
        console.log(`✅ 人材DB: 退会ステータスをリセットしました`);
      } else {
        console.log(`✅ 人材DB: 退会ステータスではありません（現在: "${currentST}"）`);
      }
    } else {
      console.log("⚠️ 人材DB: レコードが見つかりません（後で作成されます）");
    }
  } catch (error) {
    console.error("⚠️ 人材DBのSTフィールドリセットに失敗:", error);
  }
};

/** 人材レコードをUpsert */
export const upsertTalentRecord = async (
  authUserId: string,
  record: any
): Promise<string> => {
  const appIds = getAppIds();
  const client = createTalentClient();

  const existingTalents = await client.record.getAllRecords({
    app: appIds.talent,
    condition: `${TALENT_FIELDS.AUTH_USER_ID} = "${authUserId}"`,
  });

  if (existingTalents.length > 0) {
    const existingId = (existingTalents[0] as any).$id.value;
    await client.record.updateRecord({
      app: appIds.talent,
      id: existingId,
      record,
    });
    console.log(`✅ 既存の人材レコードを更新: ID=${existingId}`);
    return existingId;
  }

  const result = await client.record.addRecord({
    app: appIds.talent,
    record,
  });
  console.log(`✅ 新規人材レコードを作成: ID=${result.id}`);
  return result.id;
};

/** 案件レコードをUpsert */
export const upsertJobRecord = async (
  jobName: string,
  record: any
): Promise<string> => {
  const appIds = getAppIds();
  const client = createJobClient();

  const existingJobs = await client.record.getAllRecords({
    app: appIds.job,
    condition: `案件名 = "${jobName}"`,
  });

  if (existingJobs.length > 0) {
    const existingId = (existingJobs[0] as any).$id.value;
    await client.record.updateRecord({
      app: appIds.job,
      id: existingId,
      record,
    });
    console.log(`✅ 既存の案件を更新: ${jobName} (ID=${existingId})`);
    return existingId;
  }

  const result = await client.record.addRecord({
    app: appIds.job,
    record,
  });
  console.log(`✅ 新規案件を作成: ${jobName} (ID=${result.id})`);
  return result.id;
};

/** 応募レコードをUpsert */
export const upsertApplicationRecord = async (
  authUserId: string,
  jobId: string,
  record: any
): Promise<void> => {
  const appIds = getAppIds();
  const client = createApplicationClient();

  const existingApplications = await client.record.getAllRecords({
    app: appIds.application,
    condition: `${APPLICATION_FIELDS.AUTH_USER_ID} = "${authUserId}" and ${APPLICATION_FIELDS.JOB_ID} = "${jobId}"`,
  });

  if (existingApplications.length > 0) {
    const existingId = (existingApplications[0] as any).$id.value;
    await client.record.updateRecord({
      app: appIds.application,
      id: existingId,
      record,
    });
    console.log(`✅ 既存の応募履歴を更新: 案件ID=${jobId} (ID=${existingId})`);
  } else {
    const result = await client.record.addRecord({
      app: appIds.application,
      record,
    });
    console.log(`✅ 新規応募履歴を作成: 案件ID=${jobId} (ID=${result.id})`);
  }
};

/** 推薦レコードをUpsert（単体） */
export const upsertRecommendationRecord = async (
  talentId: string,
  jobId: string,
  record: any,
  logMessage?: string
): Promise<void> => {
  const appIds = getAppIds();
  const client = createRecommendationClient();

  const existingRecommendations = await client.record.getAllRecords({
    app: appIds.recommendation,
    condition: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${talentId}" and ${RECOMMENDATION_FIELDS.JOB_ID} = "${jobId}"`,
  });

  if (existingRecommendations.length > 0) {
    const existingId = (existingRecommendations[0] as any).$id.value;
    await client.record.updateRecord({
      app: appIds.recommendation,
      id: existingId,
      record,
    });
    if (logMessage) {
      console.log(`✅ 既存の推薦レコードを更新: ${logMessage} (ID=${existingId})`);
    }
  } else {
    const result = await client.record.addRecord({
      app: appIds.recommendation,
      record,
    });
    if (logMessage) {
      console.log(`✅ 新規推薦レコードを作成: ${logMessage} (ID=${result.id})`);
    }
  }
};
