/**
 * Lambda用 AWS Secrets Manager ユーティリティ
 *
 * Secrets Managerから設定値を取得してキャッシュする
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

// Secrets Managerクライアント（遅延初期化）
let secretsClient: SecretsManagerClient | null = null;

const getSecretsClient = (): SecretsManagerClient => {
  if (!secretsClient) {
    secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || "ap-northeast-1",
    });
  }
  return secretsClient;
};

// シークレットキャッシュ（Lambda実行中は保持）
const secretsCache = new Map<string, Record<string, string>>();

/**
 * Secrets Managerからシークレットを取得
 * @param secretId シークレットのARNまたは名前
 * @returns シークレットのキー/値オブジェクト
 */
export const getSecret = async (
  secretId: string
): Promise<Record<string, string>> => {
  // キャッシュチェック
  if (secretsCache.has(secretId)) {
    return secretsCache.get(secretId)!;
  }

  const client = getSecretsClient();

  try {
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await client.send(command);

    if (!response.SecretString) {
      throw new Error(`Secret ${secretId} has no SecretString`);
    }

    const secret = JSON.parse(response.SecretString) as Record<string, string>;

    // キャッシュに保存
    secretsCache.set(secretId, secret);
    console.log(`✅ シークレット取得成功: ${secretId}`);

    return secret;
  } catch (error) {
    console.error(`❌ シークレット取得失敗: ${secretId}`, error);
    throw error;
  }
};

/**
 * 環境変数からシークレットIDを取得し、シークレットの値を返す
 */
export const getSecretValue = async (
  secretId: string,
  key: string
): Promise<string> => {
  const secret = await getSecret(secretId);
  const value = secret[key];

  if (!value) {
    throw new Error(`Secret key "${key}" not found in ${secretId}`);
  }

  return value;
};

/**
 * Lambda設定用のシークレットを取得
 */
export interface LambdaSecrets {
  kintoneBaseUrl: string;
  kintoneTalentApiToken: string;
  kintoneJobApiToken: string;
  kintoneRecommendationApiToken: string;
  kintoneApplicationApiToken: string;
  kintoneTalentAppId: string;
  kintoneJobAppId: string;
  kintoneRecommendationAppId: string;
  kintoneApplicationAppId: string;
  databaseUrl: string;
  slackWebhookUrl: string;
}

// Lambda設定キャッシュ
let lambdaSecretsCache: LambdaSecrets | null = null;

/**
 * Lambda用のすべてのシークレットを取得
 */
export const getLambdaSecrets = async (): Promise<LambdaSecrets> => {
  // キャッシュがあれば返す
  if (lambdaSecretsCache) {
    return lambdaSecretsCache;
  }

  const secretId = process.env.LAMBDA_SECRETS_ARN;
  if (!secretId) {
    throw new Error("Missing required environment variable: LAMBDA_SECRETS_ARN");
  }

  const secret = await getSecret(secretId);

  lambdaSecretsCache = {
    kintoneBaseUrl: secret.KINTONE_BASE_URL || "",
    kintoneTalentApiToken: secret.KINTONE_TALENT_API_TOKEN || "",
    kintoneJobApiToken: secret.KINTONE_JOB_API_TOKEN || "",
    kintoneRecommendationApiToken: secret.KINTONE_RECOMMENDATION_API_TOKEN || "",
    kintoneApplicationApiToken: secret.KINTONE_APPLICATION_API_TOKEN || "",
    kintoneTalentAppId: secret.KINTONE_TALENT_APP_ID || "",
    kintoneJobAppId: secret.KINTONE_JOB_APP_ID || "",
    kintoneRecommendationAppId: secret.KINTONE_RECOMMENDATION_APP_ID || "",
    kintoneApplicationAppId: secret.KINTONE_APPLICATION_APP_ID || "",
    databaseUrl: secret.DATABASE_URL || "",
    slackWebhookUrl: secret.SLACK_WEBHOOK_URL || "",
  };

  return lambdaSecretsCache;
};

/**
 * キャッシュをクリア（テスト用）
 */
export const clearSecretsCache = (): void => {
  secretsCache.clear();
  lambdaSecretsCache = null;
};
