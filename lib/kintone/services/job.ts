import { createJobClient, getAppIds } from "../client";
import type { JobRecord, Job } from "../types";

// 作成日時から1週間以内かどうかを判定する関数
const isWithinOneWeek = (createdAt: string): boolean => {
  if (!createdAt) {
    return false;
  }

  const createdDate = new Date(createdAt);
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return createdDate >= oneWeekAgo;
};

// 環境に応じて作成日時フィールドを取得する関数
const getCreatedAt = (record: JobRecord): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment && record.作成日時_開発環境?.value) {
    return record.作成日時_開発環境.value;
  }
  
  return record.作成日時?.value || '';
};

// kintoneレコードをフロントエンド用の型に変換
const convertJobRecord = (record: JobRecord): Job => {
  const createdAt = getCreatedAt(record);
  
  return {
    id: record.$id.value,
    title: record.案件名.value,
    features: record.案件特徴.value,
    position: record.職種_ポジション.value,
    skills: record.スキル?.value || [],
    description: record.概要.value,
    environment: record.環境.value,
    notes: record.備考.value,
    requiredSkills: record.必須スキル.value,
    preferredSkills: record.尚可スキル.value,
    location: record.勤務地エリア.value,
    nearestStation: record.最寄駅.value,
    minHours: record.下限h.value,
    maxHours: record.上限h.value,
    period: record.案件期間.value,
    rate: record.掲載単価.value,
    interviewCount: record.面談回数.value,
    remote: record.ドロップダウン_3?.value || '',
    isNew: isWithinOneWeek(createdAt),
    createdAt,
  };
};

// すべての案件を取得
export const getAllJobs = async (): Promise<Job[]> => {
  const client = createJobClient();
  const appId = getAppIds().job;

  try {
    const response = await client.record.getAllRecords({
      app: appId,
    });

    return response.map((record) => convertJobRecord(record as JobRecord));
  } catch (error) {
    console.error("案件一覧の取得に失敗:", error);
    throw error;
  }
};

// 案件IDで案件詳細を取得
export const getJobById = async (jobId: string): Promise<Job | null> => {
  const client = createJobClient();
  const appId = getAppIds().job;

  try {
    const response = await client.record.getRecord({
      app: appId,
      id: jobId,
    });

    return convertJobRecord(response.record as JobRecord);
  } catch (error) {
    console.error("案件詳細の取得に失敗:", error);
    return null;
  }
};

// 案件名で案件を検索
export const getJobByTitle = async (title: string): Promise<Job | null> => {
  const client = createJobClient();
  const appId = getAppIds().job;

  try {
    const response = await client.record.getRecords({
      app: appId,
      query: `案件名 = "${title}"`,
    });

    if (response.records.length === 0) {
      return null;
    }

    return convertJobRecord(response.records[0] as JobRecord);
  } catch (error) {
    console.error("案件の検索に失敗:", error);
    return null;
  }
};

