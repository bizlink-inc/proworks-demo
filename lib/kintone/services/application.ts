import { createApplicationClient, getAppIds } from "../client";
import type { ApplicationRecord, Application } from "../types";
import { APPLICATION_FIELDS } from "../fieldMapping";

// 応募履歴のメモリキャッシュ（5分間有効）
const applicationsCache = new Map<string, { applications: Application[]; cachedAt: number }>();
const APPLICATIONS_CACHE_TTL = 5 * 60 * 1000; // 5分

/**
 * 応募キャッシュをクリアする
 */
export const clearApplicationsCache = (): void => {
  applicationsCache.clear();
  console.log("[Applications Cache] キャッシュをクリアしました");
};

// 環境に応じて作成日時フィールドを取得する関数
// kintone APP_IDで判定：開発DB（84）では作成日時_開発環境、本番DB（8）では作成日時を使用
const getCreatedAt = (record: ApplicationRecord): string => {
  const applicationAppId = process.env.KINTONE_APPLICATION_APP_ID;
  
  // 開発環境のkintone DB（APP_ID: 84）の場合は作成日時_開発環境を使用
  if (applicationAppId === '84' && record.作成日時_開発環境?.value) {
    return record.作成日時_開発環境.value;
  }
  
  // 本番環境のkintone DB（APP_ID: 8）または作成日時_開発環境が存在しない場合は作成日時を使用
  return record[APPLICATION_FIELDS.CREATED_AT].value || '';
};

// kintoneレコードをフロントエンド用の型に変換
const convertApplicationRecord = (record: ApplicationRecord): Application => {
  const appliedAt = getCreatedAt(record);
  
  return {
    id: record[APPLICATION_FIELDS.ID].value,
    authUserId: record[APPLICATION_FIELDS.AUTH_USER_ID].value,
    jobId: record[APPLICATION_FIELDS.JOB_ID].value,
    jobTitle: record[APPLICATION_FIELDS.JOB_TITLE].value,
    status: record[APPLICATION_FIELDS.STATUS].value,
    appliedAt,
  };
};

// 応募履歴取得に必要な最小限のフィールド
const APPLICATION_LIST_FIELDS = [
  APPLICATION_FIELDS.ID,
  APPLICATION_FIELDS.AUTH_USER_ID,
  APPLICATION_FIELDS.JOB_ID,
  APPLICATION_FIELDS.JOB_TITLE,
  APPLICATION_FIELDS.STATUS,
  APPLICATION_FIELDS.CREATED_AT,
  APPLICATION_FIELDS.CREATED_AT_DEV,
];

// auth_user_idで応募履歴を取得（3ヶ月以内、応募取消し除外）
// キャッシュ利用で高速化
export const getApplicationsByAuthUserId = async (authUserId: string): Promise<Application[]> => {
  // キャッシュチェック
  const now = Date.now();
  const cached = applicationsCache.get(authUserId);
  if (cached && now - cached.cachedAt < APPLICATIONS_CACHE_TTL) {
    console.log(`[Applications Cache] キャッシュヒット: ${authUserId}`);
    return cached.applications;
  }

  const client = createApplicationClient();
  const appId = getAppIds().application;
  const applicationAppId = process.env.KINTONE_APPLICATION_APP_ID;

  try {
    // 3ヶ月前の日付を計算
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const dateStr = threeMonthsAgo.toISOString().split('T')[0]; // YYYY-MM-DD形式

    // 環境に応じた作成日時フィールドを使用
    const createdAtField = applicationAppId === '84' ? '作成日時_開発環境' : APPLICATION_FIELDS.CREATED_AT;

    // Kintone側で3ヶ月フィルタリング + 有効なステータスのみ取得（応募取消し除外）
    const validStatuses = ["応募済み", "面談調整中", "面談予定", "案件参画", "見送り"];
    const statusCondition = `${APPLICATION_FIELDS.STATUS} in (${validStatuses.map(s => `"${s}"`).join(", ")})`;
    const condition = `${APPLICATION_FIELDS.AUTH_USER_ID} = "${authUserId}" and ${createdAtField} >= "${dateStr}" and ${statusCondition}`;

    // getRecordsで最大500件取得（getAllRecordsの100件ページングを回避）
    const response = await client.record.getRecords({
      app: appId,
      query: `${condition} order by ${createdAtField} desc limit 500`,
      fields: APPLICATION_LIST_FIELDS,
    });

    const applications = response.records.map((record) => convertApplicationRecord(record as unknown as ApplicationRecord));

    // キャッシュに保存
    applicationsCache.set(authUserId, { applications, cachedAt: now });
    console.log(`[Applications Cache] キャッシュ保存: ${authUserId}, ${applications.length}件`);

    return applications;
  } catch (error) {
    console.error("応募履歴の取得に失敗:", error);
    throw error;
  }
};

// 応募を作成
export const createApplication = async (data: {
  authUserId: string;
  jobId: string;
}): Promise<string> => {
  const client = createApplicationClient();
  const appId = getAppIds().application;

  try {
    const response = await client.record.addRecord({
      app: appId,
      record: {
        [APPLICATION_FIELDS.AUTH_USER_ID]: { value: data.authUserId },
        [APPLICATION_FIELDS.JOB_ID]: { value: data.jobId },
        [APPLICATION_FIELDS.STATUS]: { value: "応募済み" },
      },
    });

    console.log(`✅ 応募レコード作成成功: auth_user_id=${data.authUserId}, 案件ID=${data.jobId}, 対応状況=応募済み (レコードID: ${response.id})`);

    return response.id;
  } catch (error) {
    console.error("応募の作成に失敗:", error);
    throw error;
  }
};

// 重複チェック（パフォーマンス最適化: 1件のみ取得）
export const checkDuplicateApplication = async (
  authUserId: string,
  jobId: string
): Promise<boolean> => {
  const client = createApplicationClient();
  const appId = getAppIds().application;

  try {
    const response = await client.record.getRecords({
      app: appId,
      query: `${APPLICATION_FIELDS.AUTH_USER_ID} = "${authUserId}" and ${APPLICATION_FIELDS.JOB_ID} = "${jobId}" limit 1`,
      fields: ["$id"],
    });

    return response.records.length > 0;
  } catch (error) {
    console.error("重複チェックに失敗:", error);
    throw error;
  }
};

// 応募ステータスを更新
export const updateApplicationStatus = async (
  applicationId: string,
  status: string
): Promise<void> => {
  const client = createApplicationClient();
  const appId = getAppIds().application;

  try {
    await client.record.updateRecord({
      app: appId,
      id: applicationId,
      record: {
        [APPLICATION_FIELDS.STATUS]: { value: status },
      },
    });

    console.log(`✅ 応募ステータス更新成功: レコードID=${applicationId}, 対応状況=${status}`);
  } catch (error) {
    console.error("応募ステータスの更新に失敗:", error);
    throw error;
  }
};

