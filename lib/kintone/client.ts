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
export const createApplicationClient = () => {
  return new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_BASE_URL!,
    auth: {
      apiToken: process.env.KINTONE_APPLICATION_API_TOKEN!,
    },
  });
};

// アプリIDの取得
export const getAppIds = () => {
  const talentAppId = process.env.KINTONE_TALENT_APP_ID;
  const jobAppId = process.env.KINTONE_JOB_APP_ID;
  const applicationAppId = process.env.KINTONE_APPLICATION_APP_ID;

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

  console.log("✅ kintone App IDs 取得成功");
  console.log("   Talent App ID:", talentAppId);
  console.log("   Job App ID:", jobAppId);
  console.log("   Application App ID:", applicationAppId);

  return {
    talent: talentAppId,
    job: jobAppId,
    application: applicationAppId,
  };
};

