#!/usr/bin/env tsx

/**
 * AWS Secrets ManagerにLambda用の環境変数をプッシュするスクリプト
 * .env.aws.devまたは.env.aws.prodから必要な環境変数を抽出してSecrets Managerに保存
 *
 * 使用方法:
 *   npm run lambda:secrets:push:dev    # 開発環境にプッシュ
 *   npm run lambda:secrets:push:prod   # 本番環境にプッシュ
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const AWS_REGION = "ap-northeast-1";
const SECRET_NAMES = {
  dev: "proworks/lambda-dev",
  prod: "proworks/lambda-prod",
};

// Lambda用に必要なKintone関連の環境変数キー
const LAMBDA_ENV_KEYS = [
  "KINTONE_BASE_URL",
  "KINTONE_TALENT_API_TOKEN",
  "KINTONE_JOB_API_TOKEN",
  "KINTONE_RECOMMENDATION_API_TOKEN",
  "KINTONE_TALENT_APP_ID",
  "KINTONE_JOB_APP_ID",
  "KINTONE_RECOMMENDATION_APP_ID",
];

// .envファイルをパースする関数
const parseEnvFile = (filePath: string): Record<string, string> => {
  if (!existsSync(filePath)) {
    throw new Error(`環境変数ファイルが見つかりません: ${filePath}`);
  }

  const content = readFileSync(filePath, "utf-8");
  const envVars: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmedLine = line.trim();

    // 空行やコメント行をスキップ
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    // KEY=VALUE形式をパース
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();

      // Lambda用の環境変数のみ抽出
      if (LAMBDA_ENV_KEYS.includes(key)) {
        envVars[key] = value;
      }
    }
  }

  return envVars;
};

// シークレットが存在するか確認
const secretExists = (secretName: string): boolean => {
  try {
    execSync(
      `aws secretsmanager describe-secret --secret-id "${secretName}" --region ${AWS_REGION} 2>/dev/null`,
      { encoding: "utf-8" }
    );
    return true;
  } catch {
    return false;
  }
};

// シークレットを作成または更新
const upsertSecret = (secretName: string, secretValue: Record<string, string>): void => {
  const secretString = JSON.stringify(secretValue);

  try {
    if (secretExists(secretName)) {
      // 既存のシークレットを更新
      console.log("🔄 既存のシークレットを更新中...");
      execSync(
        `aws secretsmanager update-secret \
          --secret-id "${secretName}" \
          --secret-string '${secretString}' \
          --region ${AWS_REGION}`,
        { encoding: "utf-8" }
      );
      console.log("✅ シークレットを更新しました");
    } else {
      // 新規シークレットを作成
      console.log("🆕 新規シークレットを作成中...");
      execSync(
        `aws secretsmanager create-secret \
          --name "${secretName}" \
          --description "ProWorks Lambda環境用Kintone設定" \
          --secret-string '${secretString}' \
          --region ${AWS_REGION}`,
        { encoding: "utf-8" }
      );
      console.log("✅ シークレットを作成しました");
    }
  } catch (error) {
    console.error(`❌ シークレットの作成/更新に失敗しました:`, error);
    throw error;
  }
};

// メイン処理
const main = () => {
  const env = process.argv[2]; // 'dev' または 'prod'

  if (!env || (env !== "dev" && env !== "prod")) {
    console.error("❌ 使用方法: npm run lambda:secrets:push:dev または npm run lambda:secrets:push:prod");
    process.exit(1);
  }

  const secretName = SECRET_NAMES[env];
  const envFile = join(process.cwd(), `.env.aws.${env}`);

  console.log(`\n🚀 AWS Secrets ManagerにLambda環境変数をプッシュします`);
  console.log(`   環境: ${env}`);
  console.log(`   シークレット名: ${secretName}`);
  console.log(`   環境変数ファイル: ${envFile}\n`);

  try {
    // 環境変数ファイルを読み込む
    console.log("📖 環境変数ファイルを読み込み中...");
    const envVars = parseEnvFile(envFile);

    // 必要な環境変数がすべて揃っているか確認
    const missingKeys = LAMBDA_ENV_KEYS.filter(key => !envVars[key]);
    if (missingKeys.length > 0) {
      console.error(`❌ 以下の環境変数が見つかりません: ${missingKeys.join(", ")}`);
      process.exit(1);
    }

    console.log(`✅ ${Object.keys(envVars).length}件の環境変数を読み込みました`);

    // 読み込んだ環境変数を表示（値は隠す）
    console.log("\n📋 読み込んだ環境変数:");
    for (const key of Object.keys(envVars)) {
      const value = envVars[key];
      const maskedValue = value.length > 8
        ? value.substring(0, 4) + "..." + value.substring(value.length - 4)
        : "****";
      console.log(`   ${key}: ${maskedValue}`);
    }

    // シークレットを作成/更新
    console.log(`\n🔐 Secrets Managerにプッシュ中...`);
    upsertSecret(secretName, envVars);

    console.log(`\n✅ 完了しました！`);
    console.log(`   シークレット名: ${secretName}`);
    console.log(`   GitHub Actionsからこのシークレットを参照してLambdaをデプロイできます。\n`);
  } catch (error) {
    console.error(`\n❌ エラーが発生しました:`, error);
    process.exit(1);
  }
};

main();
