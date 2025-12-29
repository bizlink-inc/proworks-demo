/**
 * Lambda用 Kintone クライアントユーティリティ
 *
 * Secrets Managerから設定を取得してkintoneクライアントを作成
 */

import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { getLambdaSecrets, type LambdaSecrets } from "./secrets";

// フィールドコード定義
export const TALENT_FIELDS = {
  ID: "$id",
  UPDATED_AT: "更新日時",
  AUTH_USER_ID: "auth_user_id",
  FULL_NAME: "氏名",
  SKILLS: "言語_ツール",
  EXPERIENCE: "主な実績_PR_職務経歴",
  DESIRED_RATE: "希望単価_月額",
  ST: "ST",
} as const;

export const JOB_FIELDS = {
  ID: "$id",
  UPDATED_AT: "更新日時",
  TITLE: "案件名",
  POSITION: "職種_ポジション",
  SKILLS: "スキル",
  RECRUITMENT_STATUS: "募集ステータス",
  LISTING_STATUS: "掲載用ステータス",
} as const;

export const RECOMMENDATION_FIELDS = {
  ID: "$id",
  TALENT_ID: "人材ID",
  JOB_ID: "案件ID",
  SCORE: "適合スコア",
  AI_EXECUTION_STATUS: "AIマッチ実行状況",
  STAFF_RECOMMEND: "担当者おすすめ",
} as const;

export const APPLICATION_FIELDS = {
  ID: "$id",
  AUTH_USER_ID: "auth_user_id",
  JOB_ID: "案件ID",
  JOB_TITLE: "案件名",
  STATUS: "対応状況",
  INTERVIEW_DATE: "面談日",
} as const;

// 設定キャッシュ
let configCache: LambdaSecrets | null = null;

/**
 * 設定を取得（Secrets Manager経由）
 */
export const getConfig = async (): Promise<LambdaSecrets> => {
  if (configCache) {
    return configCache;
  }
  configCache = await getLambdaSecrets();
  return configCache;
};

/**
 * @deprecated 後方互換性のため残す。新規コードではgetConfig()を使用してください。
 */
export const getEnvConfig = () => {
  // 既存のLambda関数との互換性のため、環境変数から直接取得するフォールバック
  const required = [
    "KINTONE_BASE_URL",
    "KINTONE_TALENT_API_TOKEN",
    "KINTONE_JOB_API_TOKEN",
    "KINTONE_RECOMMENDATION_API_TOKEN",
    "KINTONE_TALENT_APP_ID",
    "KINTONE_JOB_APP_ID",
    "KINTONE_RECOMMENDATION_APP_ID",
    "DATABASE_URL",
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    kintoneBaseUrl: process.env.KINTONE_BASE_URL!,
    talentApiToken: process.env.KINTONE_TALENT_API_TOKEN!,
    jobApiToken: process.env.KINTONE_JOB_API_TOKEN!,
    recommendationApiToken: process.env.KINTONE_RECOMMENDATION_API_TOKEN!,
    applicationApiToken: process.env.KINTONE_APPLICATION_API_TOKEN,
    talentAppId: process.env.KINTONE_TALENT_APP_ID!,
    jobAppId: process.env.KINTONE_JOB_APP_ID!,
    recommendationAppId: process.env.KINTONE_RECOMMENDATION_APP_ID!,
    applicationAppId: process.env.KINTONE_APPLICATION_APP_ID,
    databaseUrl: process.env.DATABASE_URL!,
  };
};

// Kintone クライアント作成（同期版 - 後方互換性用）
export const createTalentClient = () => {
  const config = getEnvConfig();
  return new KintoneRestAPIClient({
    baseUrl: config.kintoneBaseUrl,
    auth: { apiToken: config.talentApiToken },
  });
};

export const createJobClient = () => {
  const config = getEnvConfig();
  return new KintoneRestAPIClient({
    baseUrl: config.kintoneBaseUrl,
    auth: { apiToken: config.jobApiToken },
  });
};

export const createRecommendationClient = () => {
  const config = getEnvConfig();
  const combinedToken = [
    config.recommendationApiToken,
    config.talentApiToken,
    config.jobApiToken,
  ].join(",");
  return new KintoneRestAPIClient({
    baseUrl: config.kintoneBaseUrl,
    auth: { apiToken: combinedToken },
  });
};

export const createApplicationClient = () => {
  const config = getEnvConfig();
  if (!config.applicationApiToken) {
    throw new Error("Missing required environment variable: KINTONE_APPLICATION_API_TOKEN");
  }
  const combinedToken = [
    config.applicationApiToken,
    config.talentApiToken,
  ].join(",");
  return new KintoneRestAPIClient({
    baseUrl: config.kintoneBaseUrl,
    auth: { apiToken: combinedToken },
  });
};

export const getAppIds = () => {
  const config = getEnvConfig();
  return {
    talent: config.talentAppId,
    job: config.jobAppId,
    recommendation: config.recommendationAppId,
    application: config.applicationAppId,
  };
};

// Kintone クライアント作成（非同期版 - Secrets Manager経由）
export const createTalentClientAsync = async () => {
  const config = await getConfig();
  return new KintoneRestAPIClient({
    baseUrl: config.kintoneBaseUrl,
    auth: { apiToken: config.kintoneTalentApiToken },
  });
};

export const createJobClientAsync = async () => {
  const config = await getConfig();
  return new KintoneRestAPIClient({
    baseUrl: config.kintoneBaseUrl,
    auth: { apiToken: config.kintoneJobApiToken },
  });
};

export const createRecommendationClientAsync = async () => {
  const config = await getConfig();
  const combinedToken = [
    config.kintoneRecommendationApiToken,
    config.kintoneTalentApiToken,
    config.kintoneJobApiToken,
  ].join(",");
  return new KintoneRestAPIClient({
    baseUrl: config.kintoneBaseUrl,
    auth: { apiToken: combinedToken },
  });
};

export const createApplicationClientAsync = async () => {
  const config = await getConfig();
  if (!config.kintoneApplicationApiToken) {
    throw new Error("KINTONE_APPLICATION_API_TOKEN is not configured in Secrets Manager");
  }
  const combinedToken = [
    config.kintoneApplicationApiToken,
    config.kintoneTalentApiToken,
  ].join(",");
  return new KintoneRestAPIClient({
    baseUrl: config.kintoneBaseUrl,
    auth: { apiToken: combinedToken },
  });
};

export const getAppIdsAsync = async () => {
  const config = await getConfig();
  return {
    talent: config.kintoneTalentAppId,
    job: config.kintoneJobAppId,
    recommendation: config.kintoneRecommendationAppId,
    application: config.kintoneApplicationAppId,
  };
};
