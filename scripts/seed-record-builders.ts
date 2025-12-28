/**
 * kintoneレコード変換（ビルダー関数）
 */

import {
  TALENT_FIELDS,
  APPLICATION_FIELDS,
  RECOMMENDATION_FIELDS,
} from "../lib/kintone/fieldMapping";
import { filterJobOptions } from "./seed-utils";

/** 人材データ型 */
export interface TalentData {
  auth_user_id: string;
  姓: string;
  名: string;
  氏名: string;
  セイ: string;
  メイ: string;
  メールアドレス: string;
  電話番号: string;
  生年月日: string;
  郵便番号: string;
  住所: string;
  言語_ツール: string;
  主な実績_PR_職務経歴: string;
  ポートフォリオリンク: string;
  稼働可能時期: string;
  希望単価_月額: number;
  希望勤務日数: string;
  希望出社頻度: string;
  希望勤務スタイル: string[];
  希望案件_作業内容: string;
  NG企業: string;
  その他要望: string;
}

/** 案件データ型 */
export interface JobData {
  案件名: string;
  ルックアップ?: string;
  職種_ポジション: string[];
  スキル: string[];
  概要: string;
  環境: string;
  必須スキル: string;
  尚可スキル: string;
  勤務地エリア: string;
  最寄駅: string;
  下限h: number;
  上限h: number;
  掲載単価: number;
  MAX単価: number;
  案件期間: string;
  参画時期: string;
  面談回数: string;
  案件特徴: string[];
  ラジオボタン: string;
  ラジオボタン_0: string;
  商流: string;
  契約形態: string;
  リモート可否: string;
  外国籍: string;
  募集人数: number;
  新着フラグ?: string;
  作成日時_開発環境?: string;
}

/** 応募データ型 */
export interface ApplicationData {
  auth_user_id: string;
  jobIndex: number;
  対応状況: string;
  作成日時_開発環境?: string;
}

/** 推薦データ型 */
export interface RecommendationData {
  jobIndex: number;
  score: number;
  staffRecommend?: boolean;
  aiMatched?: boolean;
}

/** 人材レコードを構築 */
export const buildTalentRecord = (
  talent: TalentData,
  userId: string,
  options?: {
    resumeFiles?: Array<{ fileKey: string; name: string; size: string }>;
    clearExperience?: boolean;
  }
) => ({
  [TALENT_FIELDS.AUTH_USER_ID]: { value: userId },
  [TALENT_FIELDS.LAST_NAME]: { value: talent.姓 },
  [TALENT_FIELDS.FIRST_NAME]: { value: talent.名 },
  [TALENT_FIELDS.FULL_NAME]: { value: talent.氏名 },
  [TALENT_FIELDS.LAST_NAME_KANA]: { value: talent.セイ },
  [TALENT_FIELDS.FIRST_NAME_KANA]: { value: talent.メイ },
  [TALENT_FIELDS.EMAIL]: { value: talent.メールアドレス },
  [TALENT_FIELDS.PHONE]: { value: talent.電話番号 },
  [TALENT_FIELDS.BIRTH_DATE]: { value: talent.生年月日 },
  [TALENT_FIELDS.POSTAL_CODE]: { value: talent.郵便番号 },
  [TALENT_FIELDS.ADDRESS]: { value: talent.住所 },
  [TALENT_FIELDS.SKILLS]: { value: talent.言語_ツール },
  [TALENT_FIELDS.EXPERIENCE]: {
    value: options?.clearExperience ? "" : talent.主な実績_PR_職務経歴,
  },
  [TALENT_FIELDS.RESUME_FILES]: { value: options?.resumeFiles || [] },
  [TALENT_FIELDS.PORTFOLIO_URL]: { value: talent.ポートフォリオリンク },
  [TALENT_FIELDS.AVAILABLE_FROM]: { value: talent.稼働可能時期 },
  [TALENT_FIELDS.DESIRED_RATE]: { value: talent.希望単価_月額 },
  [TALENT_FIELDS.DESIRED_WORK_DAYS]: { value: talent.希望勤務日数 },
  [TALENT_FIELDS.DESIRED_COMMUTE]: { value: talent.希望出社頻度 },
  [TALENT_FIELDS.DESIRED_WORK_STYLE]: { value: talent.希望勤務スタイル },
  [TALENT_FIELDS.DESIRED_WORK]: { value: talent.希望案件_作業内容 },
  [TALENT_FIELDS.NG_COMPANIES]: { value: talent.NG企業 },
  [TALENT_FIELDS.OTHER_REQUESTS]: { value: talent.その他要望 },
});

/** 案件レコードを構築 */
export const buildJobRecord = (job: JobData) => {
  const { positions, skills, features } = filterJobOptions(job);

  return {
    案件名: { value: job.案件名 },
    職種_ポジション: { value: positions },
    スキル: { value: skills },
    概要: { value: job.概要 },
    環境: { value: job.環境 },
    必須スキル: { value: job.必須スキル },
    尚可スキル: { value: job.尚可スキル },
    勤務地エリア: { value: job.勤務地エリア },
    最寄駅: { value: job.最寄駅 },
    下限h: { value: job.下限h },
    上限h: { value: job.上限h },
    掲載単価: { value: job.掲載単価 },
    MAX単価: { value: job.MAX単価 },
    案件期間: { value: job.案件期間 },
    参画時期: { value: job.参画時期 },
    面談回数: { value: job.面談回数 },
    案件特徴: { value: features },
    募集ステータス: { value: job.ラジオボタン },
    掲載用ステータス: { value: job.ラジオボタン_0 },
    商流: { value: job.商流 },
    契約形態: { value: job.契約形態 },
    リモート可否: { value: job.リモート可否 },
    外国籍: { value: job.外国籍 },
    募集人数: { value: job.募集人数 },
    新着フラグ: { value: job.新着フラグ || "" },
    ...(job.作成日時_開発環境
      ? { 作成日時_開発環境: { value: job.作成日時_開発環境 } }
      : {}),
  };
};

/** 案件レコードを構築（フィルタリングなし：upsert用） */
export const buildJobRecordRaw = (job: JobData) => ({
  案件名: { value: job.案件名 },
  職種_ポジション: { value: job.職種_ポジション },
  スキル: { value: job.スキル },
  概要: { value: job.概要 },
  環境: { value: job.環境 },
  必須スキル: { value: job.必須スキル },
  尚可スキル: { value: job.尚可スキル },
  勤務地エリア: { value: job.勤務地エリア },
  最寄駅: { value: job.最寄駅 },
  下限h: { value: job.下限h },
  上限h: { value: job.上限h },
  掲載単価: { value: job.掲載単価 },
  MAX単価: { value: job.MAX単価 },
  案件期間: { value: job.案件期間 },
  参画時期: { value: job.参画時期 },
  面談回数: { value: job.面談回数 },
  案件特徴: { value: job.案件特徴 },
  募集ステータス: { value: job.ラジオボタン },
  掲載用ステータス: { value: job.ラジオボタン_0 },
  商流: { value: job.商流 },
  契約形態: { value: job.契約形態 },
  リモート可否: { value: job.リモート可否 },
  外国籍: { value: job.外国籍 },
  募集人数: { value: job.募集人数 },
});

/** 応募レコードを構築 */
export const buildApplicationRecord = (
  authUserId: string,
  jobId: string,
  status: string,
  createdAtDev?: string
) => {
  const record: any = {
    [APPLICATION_FIELDS.AUTH_USER_ID]: { value: authUserId },
    [APPLICATION_FIELDS.JOB_ID]: { value: jobId },
    [APPLICATION_FIELDS.STATUS]: { value: status },
  };

  if (createdAtDev) {
    record[APPLICATION_FIELDS.CREATED_AT_DEV] = { value: createdAtDev };
  }

  return record;
};

/** 推薦レコードを構築 */
export const buildRecommendationRecord = (
  talentId: string,
  jobId: string,
  score: number | string,
  options?: {
    staffRecommend?: boolean;
    aiMatched?: boolean;
  }
) => {
  const record: any = {
    [RECOMMENDATION_FIELDS.TALENT_ID]: { value: talentId },
    [RECOMMENDATION_FIELDS.JOB_ID]: { value: jobId },
    [RECOMMENDATION_FIELDS.SCORE]: { value: score.toString() },
  };

  if (options?.staffRecommend) {
    record[RECOMMENDATION_FIELDS.STAFF_RECOMMEND] = { value: "おすすめ" };
  }

  if (options?.aiMatched) {
    record[RECOMMENDATION_FIELDS.AI_EXECUTION_STATUS] = { value: "実行済み" };
    record[RECOMMENDATION_FIELDS.AI_OVERALL_SCORE] = { value: "85" };
    record[RECOMMENDATION_FIELDS.AI_SKILL_SCORE] = { value: "90" };
    record[RECOMMENDATION_FIELDS.AI_PROCESS_SCORE] = { value: "85" };
    record[RECOMMENDATION_FIELDS.AI_INFRA_SCORE] = { value: "80" };
    record[RECOMMENDATION_FIELDS.AI_DOMAIN_SCORE] = { value: "75" };
    record[RECOMMENDATION_FIELDS.AI_TEAM_SCORE] = { value: "90" };
    record[RECOMMENDATION_FIELDS.AI_TOOL_SCORE] = { value: "85" };
    record[RECOMMENDATION_FIELDS.AI_RESULT] = {
      value: "この案件は候補者のスキルセットと非常にマッチしています。",
    };
    record[RECOMMENDATION_FIELDS.AI_EXECUTED_AT] = {
      value: new Date().toISOString(),
    };
  }

  return record;
};

/** お知らせレコードを構築 */
export const buildAnnouncementRecord = (
  type: string,
  startDate: string,
  endDate: string,
  content: string
) => ({
  掲載種別: { value: type },
  掲載開始日: { value: startDate },
  掲載終了日: { value: endDate },
  通知内容: { value: content },
});
