import { KintoneRestAPIClient } from "@kintone/rest-api-client";

// kintone クライアントの作成（人材DB用）
export const createTalentClient = () => {
  return new KintoneRestAPIClient({
    baseUrl: process.env.KINTONE_BASE_URL!,
    auth: {
      apiToken: process.env.KINTONE_TALENT_API_TOKEN!,
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
  return {
    talent: process.env.KINTONE_TALENT_APP_ID!,
    job: process.env.KINTONE_JOB_APP_ID!,
    application: process.env.KINTONE_APPLICATION_APP_ID!,
  };
};

