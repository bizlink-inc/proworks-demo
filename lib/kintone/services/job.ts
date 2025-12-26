import { createJobClient, getAppIds } from "../client";
import type { JobRecord, Job } from "../types";

// 案件情報のメモリキャッシュ（5分間有効）
const jobCache = new Map<string, { job: Job; cachedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分

// 全案件キャッシュ（5分間有効）
let allJobsCache: { jobs: Job[]; cachedAt: number } | null = null;
const ALL_JOBS_CACHE_TTL = 5 * 60 * 1000; // 5分

/**
 * 案件キャッシュをクリアする
 * 開発時のパフォーマンステスト用
 */
export const clearJobCache = (): void => {
  jobCache.clear();
  allJobsCache = null;
  console.log("[Job Cache] キャッシュをクリアしました");
};

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
// kintone APP_IDで判定：開発DB（85）では作成日時_開発環境、本番DB（73）では作成日時を使用
const getCreatedAt = (record: JobRecord): string => {
  const jobAppId = process.env.KINTONE_JOB_APP_ID;
  
  // 開発環境のkintone DB（APP_ID: 85）の場合は作成日時_開発環境を使用
  if (jobAppId === '85' && record.作成日時_開発環境?.value) {
    return record.作成日時_開発環境.value;
  }
  
  // 本番環境のkintone DB（APP_ID: 73）または作成日時_開発環境が存在しない場合は作成日時を使用
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
    remote: record.リモート可否?.value || '',
    recruitmentStatus: record.募集ステータス?.value || '募集中',
    isNew: isWithinOneWeek(createdAt),
    createdAt,
  };
};

// 一覧表示用の必須フィールド（軽量化用）
const JOB_LIST_FIELDS = [
  '$id',
  '案件名',
  '案件特徴',
  '職種_ポジション',
  'スキル',
  '勤務地エリア',
  '最寄駅',
  '掲載単価',
  'リモート可否',
  '募集ステータス',
  '作成日時',
  '作成日時_開発環境',
];

// 一覧表示用の軽量変換（不要なフィールドはデフォルト値）
const convertJobRecordForList = (record: Partial<JobRecord>): Job => {
  const jobAppId = process.env.KINTONE_JOB_APP_ID;
  let createdAt = '';

  if (jobAppId === '85' && record.作成日時_開発環境?.value) {
    createdAt = record.作成日時_開発環境.value;
  } else {
    createdAt = record.作成日時?.value || '';
  }

  return {
    id: record.$id?.value || '',
    title: record.案件名?.value || '',
    features: record.案件特徴?.value || '',
    position: record.職種_ポジション?.value || '',
    skills: record.スキル?.value || [],
    description: '',  // 一覧では不要
    environment: '',  // 一覧では不要
    notes: '',  // 一覧では不要
    requiredSkills: '',  // 一覧では不要
    preferredSkills: '',  // 一覧では不要
    location: record.勤務地エリア?.value || '',
    nearestStation: record.最寄駅?.value || '',
    minHours: '',  // 一覧では不要
    maxHours: '',  // 一覧では不要
    period: '',  // 一覧では不要
    rate: record.掲載単価?.value || '',
    interviewCount: '',  // 一覧では不要
    remote: record.リモート可否?.value || '',
    recruitmentStatus: record.募集ステータス?.value || '募集中',
    isNew: isWithinOneWeek(createdAt),
    createdAt,
  };
};

// すべての案件を取得（キャッシュ対応・軽量化）
export const getAllJobs = async (): Promise<Job[]> => {
  const now = Date.now();

  // キャッシュが有効な場合はキャッシュから返す
  if (allJobsCache && now - allJobsCache.cachedAt < ALL_JOBS_CACHE_TTL) {
    return allJobsCache.jobs;
  }

  const client = createJobClient();
  const appId = getAppIds().job;

  try {
    // getRecordsで最大500件取得（getAllRecordsの100件ページングを回避）
    // fieldsパラメータで必要なフィールドのみ取得
    const response = await client.record.getRecords({
      app: appId,
      query: `募集ステータス in ("募集中", "クローズ") order by $id desc limit 500`,
      fields: JOB_LIST_FIELDS,
    });

    const jobs = response.records.map((record) => convertJobRecordForList(record as Partial<JobRecord>));

    // キャッシュに保存
    allJobsCache = { jobs, cachedAt: now };

    return jobs;
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

// 複数の案件IDで案件を一括取得（N+1問題解消用・軽量版・キャッシュ対応）
export const getJobsByIds = async (jobIds: string[]): Promise<Map<string, Job>> => {
  if (jobIds.length === 0) {
    return new Map();
  }

  const now = Date.now();
  const result = new Map<string, Job>();
  const uncachedIds: string[] = [];

  // 重複を除去
  const uniqueJobIds = [...new Set(jobIds)];

  // キャッシュから取得可能なものを取得
  for (const id of uniqueJobIds) {
    const cached = jobCache.get(id);
    if (cached && now - cached.cachedAt < CACHE_TTL) {
      result.set(id, cached.job);
    } else {
      uncachedIds.push(id);
    }
  }

  // キャッシュにないものがあればKintoneから取得
  if (uncachedIds.length > 0) {
    const client = createJobClient();
    const appId = getAppIds().job;

    try {
      // kintoneクエリ: $id in ("1", "2", "3")
      const condition = `$id in (${uncachedIds.map(id => `"${id}"`).join(", ")})`;

      // getRecordsで最大500件取得（getAllRecordsの100件ページングを回避）
      const response = await client.record.getRecords({
        app: appId,
        query: `${condition} limit 500`,
        fields: JOB_LIST_FIELDS,
      });

      for (const record of response.records) {
        const job = convertJobRecordForList(record as Partial<JobRecord>);
        // キャッシュに保存
        jobCache.set(job.id, { job, cachedAt: now });
        result.set(job.id, job);
      }
    } catch (error) {
      console.error("複数案件の一括取得に失敗:", error);
      throw error;
    }
  }

  return result;
};

// 案件名で案件を検索
export const getJobByTitle = async (title: string): Promise<Job | null> => {
  const client = createJobClient();
  const appId = getAppIds().job;

  try {
    const records = await client.record.getAllRecords({
      app: appId,
      condition: `案件名 = "${title}"`,
    });

    if (records.length === 0) {
      return null;
    }

    return convertJobRecord(records[0] as JobRecord);
  } catch (error) {
    console.error("案件の検索に失敗:", error);
    return null;
  }
};

