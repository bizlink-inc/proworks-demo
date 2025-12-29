#!/usr/bin/env tsx

/**
 * AWS Secrets ManagerにApp Runner用の環境変数をプッシュするスクリプト
 * .env.aws.devまたは.env.aws.prodから環境変数を抽出してSecrets Managerに保存
 *
 * 使用方法:
 *   npm run apprunner:secrets:push:dev    # 開発環境にプッシュ
 *   npm run apprunner:secrets:push:prod   # 本番環境にプッシュ
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const AWS_REGION = "ap-northeast-1";
const SECRET_NAMES = {
  dev: "proworks/apprunner-dev",
  prod: "proworks/apprunner-prod",
};

// Secrets Manager ARN参照として除外するキー（これらはApp Runnerで直接ARN参照する）
const SECRETS_MANAGER_KEYS = ["DATABASE_URL", "GEMINI_API_KEY"];

// .envファイルをパースする関数
const parseEnvFile = (filePath: string): {
  plaintext: Record<string, string>;
  secretsManagerArns: Record<string, string>;
} => {
  if (!existsSync(filePath)) {
    throw new Error(`環境変数ファイルが見つかりません: ${filePath}`);
  }

  const content = readFileSync(filePath, "utf-8");
  const plaintext: Record<string, string> = {};
  const secretsManagerArns: Record<string, string> = {};

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

      // 空の値はスキップ
      if (!value || value === "") {
        continue;
      }

      // SECRETS_MANAGER_プレフィックスがある場合はARN参照として保存
      if (key.startsWith("SECRETS_MANAGER_")) {
        const secretKey = key.replace("SECRETS_MANAGER_", "");
        secretsManagerArns[secretKey] = value;
      } else {
        plaintext[key] = value;
      }
    }
  }

  return { plaintext, secretsManagerArns };
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
          --secret-string '${secretString.replace(/'/g, "'\\''")}' \
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
          --description "ProWorks App Runner環境用環境変数" \
          --secret-string '${secretString.replace(/'/g, "'\\''")}' \
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
    console.error("❌ 使用方法: npm run apprunner:secrets:push:dev または npm run apprunner:secrets:push:prod");
    process.exit(1);
  }

  const secretName = SECRET_NAMES[env];
  const envFile = join(process.cwd(), `.env.aws.${env}`);

  console.log(`\n🚀 AWS Secrets ManagerにApp Runner環境変数をプッシュします`);
  console.log(`   環境: ${env}`);
  console.log(`   シークレット名: ${secretName}`);
  console.log(`   環境変数ファイル: ${envFile}\n`);

  try {
    // 環境変数ファイルを読み込む
    console.log("📖 環境変数ファイルを読み込み中...");
    const { plaintext, secretsManagerArns } = parseEnvFile(envFile);

    console.log(`✅ ${Object.keys(plaintext).length}件のプレーンテキスト環境変数を読み込みました`);
    if (Object.keys(secretsManagerArns).length > 0) {
      console.log(`✅ ${Object.keys(secretsManagerArns).length}件のSecrets Manager ARN参照を検出しました（これらはプッシュしません）`);
    }

    // 読み込んだ環境変数を表示（値は隠す）
    console.log("\n📋 プッシュする環境変数:");
    for (const key of Object.keys(plaintext)) {
      const value = plaintext[key];
      const maskedValue = value.length > 8
        ? value.substring(0, 4) + "..." + value.substring(value.length - 4)
        : "****";
      console.log(`   ${key}: ${maskedValue}`);
    }

    if (Object.keys(secretsManagerArns).length > 0) {
      console.log("\n📋 Secrets Manager ARN参照（App Runnerで直接参照）:");
      for (const key of Object.keys(secretsManagerArns)) {
        console.log(`   ${key}: (ARN参照)`);
      }
    }

    // シークレットを作成/更新
    console.log(`\n🔐 Secrets Managerにプッシュ中...`);
    upsertSecret(secretName, plaintext);

    console.log(`\n✅ 完了しました！`);
    console.log(`   シークレット名: ${secretName}`);
    console.log(`   GitHub Actionsからこのシークレットを参照してApp Runnerをデプロイできます。\n`);
  } catch (error) {
    console.error(`\n❌ エラーが発生しました:`, error);
    process.exit(1);
  }
};

main();
