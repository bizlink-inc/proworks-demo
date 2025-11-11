import { createApplicationClient, getAppIds } from "../client";
import type { ApplicationRecord, Application } from "../types";

// kintoneレコードをフロントエンド用の型に変換
const convertApplicationRecord = (record: ApplicationRecord): Application => {
  return {
    id: record.$id.value,
    jobTitle: record.案件名.value,
    talentName: record.人材名.value,
    status: record.対応状況.value,
    appliedAt: record.作成日時.value,
  };
};

// 人材名で応募履歴を取得
export const getApplicationsByTalentName = async (talentName: string): Promise<Application[]> => {
  const client = createApplicationClient();
  const appId = getAppIds().application;

  try {
    const response = await client.record.getRecords({
      app: appId,
      query: `人材名 = "${talentName}"`,
    });

    return response.records.map((record) => convertApplicationRecord(record as ApplicationRecord));
  } catch (error) {
    console.error("応募履歴の取得に失敗:", error);
    throw error;
  }
};

// 応募を作成
export const createApplication = async (data: {
  jobTitle: string;
  talentName: string;
}): Promise<string> => {
  const client = createApplicationClient();
  const appId = getAppIds().application;

  try {
    const response = await client.record.addRecord({
      app: appId,
      record: {
        案件名: { value: data.jobTitle },
        人材名: { value: data.talentName },
        対応状況: { value: "回答待ち" },
      },
    });

    return response.id;
  } catch (error) {
    console.error("応募の作成に失敗:", error);
    throw error;
  }
};

// 重複チェック
export const checkDuplicateApplication = async (
  talentName: string,
  jobTitle: string
): Promise<boolean> => {
  const client = createApplicationClient();
  const appId = getAppIds().application;

  try {
    const response = await client.record.getRecords({
      app: appId,
      query: `人材名 = "${talentName}" and 案件名 = "${jobTitle}"`,
    });

    return response.records.length > 0;
  } catch (error) {
    console.error("重複チェックに失敗:", error);
    throw error;
  }
};

