import { createApplicationClient, getAppIds } from "../client";
import type { ApplicationRecord, Application } from "../types";

// kintoneレコードをフロントエンド用の型に変換
const convertApplicationRecord = (record: ApplicationRecord): Application => {
  return {
    id: record.$id.value,
    authUserId: record.auth_user_id.value,
    jobId: record.案件ID.value,
    jobTitle: record.案件名.value, // ルックアップで取得
    status: record.対応状況.value,
    memo: record.文字列__複数行_.value,
    appliedAt: record.作成日時.value,
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
        auth_user_id: { value: data.authUserId },
        案件ID: { value: data.jobId },
        対応状況: { value: "応募済み" },
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
      query: `auth_user_id = "${authUserId}" and 案件ID = "${jobId}"`,
    });

    return response.records.length > 0;
  } catch (error) {
    console.error("重複チェックに失敗:", error);
    throw error;
  }
};

