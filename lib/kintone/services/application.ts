import { createApplicationClient, getAppIds } from "../client";
import type { ApplicationRecord, Application } from "../types";
import { APPLICATION_FIELDS } from "../fieldMapping";

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

// auth_user_idで応募履歴を取得
export const getApplicationsByAuthUserId = async (authUserId: string): Promise<Application[]> => {
  const client = createApplicationClient();
  const appId = getAppIds().application;

  try {
    const response = await client.record.getRecords({
      app: appId,
      query: `auth_user_id = "${authUserId}"`,
    });

    return response.records.map((record) => convertApplicationRecord(record as ApplicationRecord));
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

// 重複チェック
export const checkDuplicateApplication = async (
  authUserId: string,
  jobId: string
): Promise<boolean> => {
  const client = createApplicationClient();
  const appId = getAppIds().application;

  try {
    const response = await client.record.getRecords({
      app: appId,
      query: `${APPLICATION_FIELDS.AUTH_USER_ID} = "${authUserId}" and ${APPLICATION_FIELDS.JOB_ID} = "${jobId}"`,
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

