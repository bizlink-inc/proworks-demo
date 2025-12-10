import { createApplicationClient, getAppIds } from "../client";
import type { ApplicationRecord, Application } from "../types";
import { APPLICATION_FIELDS } from "../fieldMapping";

// 環境に応じて作成日時フィールドを取得する関数
const getCreatedAt = (record: ApplicationRecord): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment && record.作成日時_開発環境?.value) {
    return record.作成日時_開発環境.value;
  }
  
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

