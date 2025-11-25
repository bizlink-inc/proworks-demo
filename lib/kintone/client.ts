import { KintoneRestAPIClient } from "@kintone/rest-api-client";

// kintone クライアントの作成（人材DB用）
export const createTalentClient = () => {
  const baseUrl = process.env.KINTONE_BASE_URL;
  const apiToken = process.env.KINTONE_TALENT_API_TOKEN;

  if (!baseUrl) {
    console.error("❌ KINTONE_BASE_URL が設定されていません");
    throw new Error("KINTONE_BASE_URL is not defined");
  }

  if (!apiToken) {
    console.error("❌ KINTONE_TALENT_API_TOKEN が設定されていません");
    throw new Error("KINTONE_TALENT_API_TOKEN is not defined");
  }

  console.log("✅ kintone Talent Client 初期化成功");
  console.log("   Base URL:", baseUrl);
  console.log("   API Token:", apiToken.substring(0, 10) + "...");

  return new KintoneRestAPIClient({
    baseUrl,
    auth: {
      apiToken,
    },
  });
};

// kintone クライアントの作成（案件DB用）
export const createJobClient = () => {
  return new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_BASE_URL!,
    auth: {
      apiToken: process.env.KINTONE_JOB_API_TOKEN!,
    },
  });
};

// kintone クライアントの作成（応募履歴用）
// 応募履歴DBは人材DBと案件DBを参照するため、3つのAPIトークンを連結
export const createApplicationClient = () => {
  const baseUrl = process.env.KINTONE_BASE_URL;
  const applicationToken = process.env.KINTONE_APPLICATION_API_TOKEN;
  const talentToken = process.env.KINTONE_TALENT_API_TOKEN;
  const jobToken = process.env.KINTONE_JOB_API_TOKEN;

  if (!baseUrl) {
    console.error("❌ KINTONE_BASE_URL が設定されていません");
    throw new Error("KINTONE_BASE_URL is not defined");
  }

  if (!applicationToken) {
    console.error("❌ KINTONE_APPLICATION_API_TOKEN が設定されていません");
    throw new Error("KINTONE_APPLICATION_API_TOKEN is not defined");
  }

  if (!talentToken) {
    console.error("❌ KINTONE_TALENT_API_TOKEN が設定されていません");
    throw new Error("KINTONE_TALENT_API_TOKEN is not defined");
  }

  if (!jobToken) {
    console.error("❌ KINTONE_JOB_API_TOKEN が設定されていません");
    throw new Error("KINTONE_JOB_API_TOKEN is not defined");
  }

  // 複数のAPIトークンをカンマ区切りで連結
  const combinedToken = [applicationToken, talentToken, jobToken].join(",");

  console.log("✅ kintone Application Client 初期化成功");
  console.log("   Base URL:", baseUrl);
  console.log("   Combined API Tokens: 3つのトークンを連結");

  return new KintoneRestAPIClient({
    baseUrl,
    auth: {
      apiToken: combinedToken,
    },
  });
};

// kintone クライアントの作成（推薦DB用）
export const createRecommendationClient = () => {
  const baseUrl = process.env.KINTONE_BASE_URL;
  const apiToken = process.env.KINTONE_RECOMMENDATION_API_TOKEN;

  if (!baseUrl) {
    console.error("❌ KINTONE_BASE_URL が設定されていません");
    throw new Error("KINTONE_BASE_URL is not defined");
  }

  if (!apiToken) {
    console.error("❌ KINTONE_RECOMMENDATION_API_TOKEN が設定されていません");
    throw new Error("KINTONE_RECOMMENDATION_API_TOKEN is not defined");
  }

  console.log("✅ kintone Recommendation Client 初期化成功");
  console.log("   Base URL:", baseUrl);
  console.log("   API Token:", apiToken.substring(0, 10) + "...");

  return new KintoneRestAPIClient({
    baseUrl,
    auth: {
      apiToken,
    },
  });
};

// アプリIDの取得
export const getAppIds = () => {
  const talentAppId = process.env.KINTONE_TALENT_APP_ID;
  const jobAppId = process.env.KINTONE_JOB_APP_ID;
  const applicationAppId = process.env.KINTONE_APPLICATION_APP_ID;
  const recommendationAppId = process.env.KINTONE_RECOMMENDATION_APP_ID;

  if (!talentAppId) {
    console.error("❌ KINTONE_TALENT_APP_ID が設定されていません");
    throw new Error("KINTONE_TALENT_APP_ID is not defined");
  }

  if (!jobAppId) {
    console.error("❌ KINTONE_JOB_APP_ID が設定されていません");
    throw new Error("KINTONE_JOB_APP_ID is not defined");
  }

  if (!applicationAppId) {
    console.error("❌ KINTONE_APPLICATION_APP_ID が設定されていません");
    throw new Error("KINTONE_APPLICATION_APP_ID is not defined");
  }

  // 推薦DBはオプション（なくても動作する）
  if (recommendationAppId) {
    console.log("✅ kintone App IDs 取得成功");
    console.log("   Talent App ID:", talentAppId);
    console.log("   Job App ID:", jobAppId);
    console.log("   Application App ID:", applicationAppId);
    console.log("   Recommendation App ID:", recommendationAppId);
  } else {
    console.log("✅ kintone App IDs 取得成功");
    console.log("   Talent App ID:", talentAppId);
    console.log("   Job App ID:", jobAppId);
    console.log("   Application App ID:", applicationAppId);
    console.log("   ⚠️ Recommendation App ID: 未設定");
  }

  return {
    talent: talentAppId,
    job: jobAppId,
    application: applicationAppId,
    recommendation: recommendationAppId,
  };
};

