#!/usr/bin/env tsx

/**
 * AWS App Runnerの環境変数を.env.aws.devまたは.env.aws.prodから更新するスクリプト
 * 
 * 使用方法:
 *   npm run env:push:dev    # 開発環境にプッシュ
 *   npm run env:push:prod   # 本番環境にプッシュ
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const AWS_REGION = "ap-northeast-1";
const SERVICE_NAMES = {
  dev: "proworks-dev",
  prod: "proworks-prod",
};

// .envファイルをパースする関数
const parseEnvFile = (filePath: string): {
  plaintext: Record<string, string>;
  secrets: Record<string, string>;
} => {
  if (!existsSync(filePath)) {
    throw new Error(`環境変数ファイルが見つかりません: ${filePath}`);
  }

  const content = readFileSync(filePath, "utf-8");
  const plaintext: Record<string, string> = {};
  const secrets: Record<string, string> = {};

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
      
      // 空の値はスキップ（TODOコメントなど）
      if (!value || value === "") {
        continue;
      }
      
      // SECRETS_MANAGER_プレフィックスがある場合はSecrets Managerの環境変数として扱う
      if (key.startsWith("SECRETS_MANAGER_")) {
        const secretKey = key.replace("SECRETS_MANAGER_", "");
        secrets[secretKey] = value; // ARNを値として設定
      } else {
        plaintext[key] = value;
      }
    }
  }

  return { plaintext, secrets };
};

// App RunnerサービスのARNを取得
const getServiceArn = (serviceName: string): string => {
  try {
    const output = execSync(
      `aws apprunner list-services --region ${AWS_REGION} --query "ServiceSummaryList[?ServiceName=='${serviceName}'].ServiceArn" --output text`,
      { encoding: "utf-8" }
    ).trim();

    if (!output) {
      throw new Error(`App Runnerサービス '${serviceName}' が見つかりません`);
    }

    return output;
  } catch (error) {
    console.error(`❌ App RunnerサービスARNの取得に失敗しました:`, error);
    throw error;
  }
};

// 現在の環境変数を取得
const getCurrentEnvironmentVariables = (serviceArn: string): {
  plaintext: Record<string, string>;
  secrets: Record<string, string>;
} => {
  try {
    const output = execSync(
      `aws apprunner describe-service --service-arn ${serviceArn} --region ${AWS_REGION}`,
      { encoding: "utf-8" }
    );

    const service = JSON.parse(output);
    // 環境変数は SourceConfiguration.ImageConfiguration.RuntimeEnvironmentVariables に含まれる（オブジェクト形式）
    const envVars = service.Service?.SourceConfiguration?.ImageConfiguration?.RuntimeEnvironmentVariables || {};
    // Secrets Managerの環境変数は RuntimeEnvironmentSecrets に含まれる（オブジェクト形式）
    const envSecrets = service.Service?.SourceConfiguration?.ImageConfiguration?.RuntimeEnvironmentSecrets || {};
    
    return {
      plaintext: envVars,
      secrets: envSecrets,
    };
  } catch (error) {
    console.error(`❌ 現在の環境変数の取得に失敗しました:`, error);
    throw error;
  }
};

// 環境変数を更新
const updateEnvironmentVariables = (
  serviceArn: string,
  envVars: Record<string, string>,
  existingSecrets: Record<string, string>
): void => {
  try {
    // サービス設定を取得
    const describeOutput = execSync(
      `aws apprunner describe-service --service-arn ${serviceArn} --region ${AWS_REGION}`,
      { encoding: "utf-8" }
    );
    const service = JSON.parse(describeOutput);
    const sourceConfiguration = service.Service?.SourceConfiguration || {};
    const imageRepository = sourceConfiguration.ImageRepository || {};
    const imageConfiguration = imageRepository.ImageConfiguration || {};

    // 既存のSecrets Managerの環境変数を保持（オブジェクト形式）
    const runtimeEnvironmentSecrets = existingSecrets;

    // SourceConfigurationのJSONを作成（既存の設定を保持）
    const sourceConfigJson = {
      ImageRepository: {
        ImageIdentifier: imageRepository.ImageIdentifier,
        ImageRepositoryType: imageRepository.ImageRepositoryType || "ECR",
        ImageConfiguration: {
          Port: imageConfiguration.Port || "8080",
          RuntimeEnvironmentVariables: envVars, // オブジェクト形式
          RuntimeEnvironmentSecrets: runtimeEnvironmentSecrets, // オブジェクト形式
        },
      },
      AutoDeploymentsEnabled: sourceConfiguration.AutoDeploymentsEnabled !== false,
      AuthenticationConfiguration: sourceConfiguration.AuthenticationConfiguration || {},
    };

    // 一時ファイルにJSONを書き込む
    const tmpFile = `/tmp/apprunner-source-config-${Date.now()}.json`;
    require("fs").writeFileSync(tmpFile, JSON.stringify(sourceConfigJson, null, 2));

    // update-serviceコマンドを実行
    console.log("🔄 環境変数を更新中...");
    const updateOutput = execSync(
      `aws apprunner update-service \
        --service-arn ${serviceArn} \
        --region ${AWS_REGION} \
        --source-configuration file://${tmpFile}`,
      { encoding: "utf-8" }
    );
    
    // 更新結果を確認（エラーチェック用）
    const updateResult = JSON.parse(updateOutput);
    if (updateResult.Service?.Status === "OPERATION_IN_PROGRESS") {
      console.log(`✅ 更新リクエストが正常に送信されました`);
      console.log(`   OperationId: ${updateResult.OperationId}`);
    }

    // 一時ファイルを削除
    require("fs").unlinkSync(tmpFile);

    console.log("✅ 環境変数の更新リクエストを送信しました");
    console.log(`   更新された環境変数: ${Object.keys(envVars).length}件`);
    if (Object.keys(existingSecrets).length > 0) {
      console.log(`   保持されたSecrets Manager環境変数: ${Object.keys(existingSecrets).length}件`);
    }
  } catch (error) {
    console.error(`❌ 環境変数の更新に失敗しました:`, error);
    throw error;
  }
};

// メイン処理
const main = () => {
  const env = process.argv[2]; // 'dev' または 'prod'

  if (!env || (env !== "dev" && env !== "prod")) {
    console.error("❌ 使用方法: npm run env:push:dev または npm run env:push:prod");
    process.exit(1);
  }

  const serviceName = SERVICE_NAMES[env];
  const envFile = join(process.cwd(), `.env.aws.${env}`);

  console.log(`\n🚀 AWS App Runner環境変数を更新します`);
  console.log(`   環境: ${env}`);
  console.log(`   サービス名: ${serviceName}`);
  console.log(`   環境変数ファイル: ${envFile}\n`);

  try {
    // 環境変数ファイルを読み込む
    console.log("📖 環境変数ファイルを読み込み中...");
    const { plaintext: envVars, secrets: fileSecrets } = parseEnvFile(envFile);
    console.log(`✅ ${Object.keys(envVars).length}件のプレーンテキスト環境変数を読み込みました`);
    if (Object.keys(fileSecrets).length > 0) {
      console.log(`✅ ${Object.keys(fileSecrets).length}件のSecrets Manager環境変数を読み込みました`);
    }

    // サービスARNを取得
    console.log(`\n🔍 App RunnerサービスARNを取得中...`);
    const serviceArn = getServiceArn(serviceName);
    console.log(`✅ サービスARN: ${serviceArn}`);

    // 現在の環境変数を取得（既存のSecrets Managerの環境変数を保持するため）
    console.log(`\n📋 現在の環境変数を取得中...`);
    const { plaintext: currentPlaintext, secrets: currentSecrets } = getCurrentEnvironmentVariables(serviceArn);
    console.log(`✅ 現在の環境変数を取得しました（プレーンテキスト: ${Object.keys(currentPlaintext).length}件、Secrets Manager: ${Object.keys(currentSecrets).length}件）`);

    // ファイルから読み込んだSecrets Manager環境変数と既存のものをマージ
    // ファイルの設定を優先し、既存のものも保持（ファイルにないもの）
    const mergedSecrets = { ...currentSecrets, ...fileSecrets };

    // 環境変数を更新
    console.log(`\n🔄 環境変数を更新中...`);
    updateEnvironmentVariables(serviceArn, envVars, mergedSecrets);

    console.log(`\n✅ 完了しました！`);
    console.log(`   サービスが更新されるまで数分かかる場合があります。`);
    console.log(`   AWSコンソールでデプロイ状況を確認してください。\n`);
  } catch (error) {
    console.error(`\n❌ エラーが発生しました:`, error);
    process.exit(1);
  }
};

main();

