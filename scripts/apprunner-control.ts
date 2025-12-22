#!/usr/bin/env tsx

/**
 * AWS App Runnerのインスタンスを起動・停止するスクリプト
 * 
 * 使用方法:
 *   npm run apprunner:start:dev    # 開発環境を起動
 *   npm run apprunner:start:prod   # 本番環境を起動
 *   npm run apprunner:stop:dev     # 開発環境を停止
 *   npm run apprunner:stop:prod    # 本番環境を停止
 *   npm run apprunner:status:dev   # 開発環境の状態を確認
 *   npm run apprunner:status:prod  # 本番環境の状態を確認
 */

import { execSync } from "child_process";

const AWS_REGION = "ap-northeast-1";
const SERVICE_NAMES = {
  dev: "proworks-dev",
  prod: "proworks-prod",
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

// サービスの状態を取得
const getServiceStatus = (serviceArn: string): string => {
  try {
    const output = execSync(
      `aws apprunner describe-service --service-arn ${serviceArn} --region ${AWS_REGION}`,
      { encoding: "utf-8" }
    );

    const service = JSON.parse(output);
    return service.Service?.Status || "UNKNOWN";
  } catch (error) {
    console.error(`❌ サービスの状態取得に失敗しました:`, error);
    throw error;
  }
};

// サービスを起動（resume）
const startService = (serviceArn: string, serviceName: string): void => {
  try {
    const currentStatus = getServiceStatus(serviceArn);
    
    if (currentStatus === "RUNNING") {
      console.log(`✅ サービス '${serviceName}' は既に起動中です`);
      return;
    }

    if (currentStatus === "PAUSED") {
      console.log(`🚀 サービス '${serviceName}' を起動中...`);
      const output = execSync(
        `aws apprunner resume-service --service-arn ${serviceArn} --region ${AWS_REGION}`,
        { encoding: "utf-8" }
      );
      
      const result = JSON.parse(output);
      console.log(`✅ サービス起動リクエストを送信しました`);
      console.log(`   OperationId: ${result.OperationId}`);
      console.log(`   サービスが起動するまで数分かかる場合があります`);
    } else {
      console.log(`⚠️  サービス '${serviceName}' の現在の状態: ${currentStatus}`);
      console.log(`   起動可能な状態ではありません（PAUSED状態の時のみ起動可能です）`);
    }
  } catch (error) {
    console.error(`❌ サービスの起動に失敗しました:`, error);
    throw error;
  }
};

// サービスを停止（pause）
const stopService = (serviceArn: string, serviceName: string): void => {
  try {
    const currentStatus = getServiceStatus(serviceArn);
    
    if (currentStatus === "PAUSED") {
      console.log(`✅ サービス '${serviceName}' は既に停止中です`);
      return;
    }

    if (currentStatus === "RUNNING") {
      console.log(`🛑 サービス '${serviceName}' を停止中...`);
      const output = execSync(
        `aws apprunner pause-service --service-arn ${serviceArn} --region ${AWS_REGION}`,
        { encoding: "utf-8" }
      );
      
      const result = JSON.parse(output);
      console.log(`✅ サービス停止リクエストを送信しました`);
      console.log(`   OperationId: ${result.OperationId}`);
      console.log(`   サービスが停止するまで数分かかる場合があります`);
    } else {
      console.log(`⚠️  サービス '${serviceName}' の現在の状態: ${currentStatus}`);
      console.log(`   停止可能な状態ではありません（RUNNING状態の時のみ停止可能です）`);
    }
  } catch (error) {
    console.error(`❌ サービスの停止に失敗しました:`, error);
    throw error;
  }
};

// サービスの状態を表示
const showStatus = (serviceArn: string, serviceName: string): void => {
  try {
    const status = getServiceStatus(serviceArn);
    
    console.log(`\n📊 サービス '${serviceName}' の状態`);
    console.log(`   状態: ${status}`);
    
    // 状態に応じた説明を表示
    switch (status) {
      case "RUNNING":
        console.log(`   ✅ サービスは起動中です`);
        break;
      case "PAUSED":
        console.log(`   ⏸️  サービスは停止中です`);
        break;
      case "OPERATION_IN_PROGRESS":
        console.log(`   🔄 操作が進行中です（起動または停止処理中）`);
        break;
      case "CREATE_FAILED":
        console.log(`   ❌ サービスの作成に失敗しました`);
        break;
      default:
        console.log(`   ℹ️  状態: ${status}`);
    }
    
    console.log(`   サービスARN: ${serviceArn}\n`);
  } catch (error) {
    console.error(`❌ サービスの状態取得に失敗しました:`, error);
    throw error;
  }
};

// メイン処理
const main = () => {
  const command = process.argv[2]; // 'start', 'stop', 'status'
  const env = process.argv[3]; // 'dev' または 'prod'

  if (!command || !["start", "stop", "status"].includes(command)) {
    console.error("❌ 使用方法:");
    console.error("   npm run apprunner:start:dev    # 開発環境を起動");
    console.error("   npm run apprunner:start:prod   # 本番環境を起動");
    console.error("   npm run apprunner:stop:dev     # 開発環境を停止");
    console.error("   npm run apprunner:stop:prod    # 本番環境を停止");
    console.error("   npm run apprunner:status:dev   # 開発環境の状態を確認");
    console.error("   npm run apprunner:status:prod  # 本番環境の状態を確認");
    process.exit(1);
  }

  if (!env || (env !== "dev" && env !== "prod")) {
    console.error("❌ 環境を指定してください: dev または prod");
    process.exit(1);
  }

  const serviceName = SERVICE_NAMES[env];

  try {
    console.log(`\n🔍 App RunnerサービスARNを取得中...`);
    const serviceArn = getServiceArn(serviceName);
    console.log(`✅ サービスARN: ${serviceArn}\n`);

    switch (command) {
      case "start":
        startService(serviceArn, serviceName);
        break;
      case "stop":
        stopService(serviceArn, serviceName);
        break;
      case "status":
        showStatus(serviceArn, serviceName);
        break;
    }

    console.log(`\n✅ 完了しました！\n`);
  } catch (error) {
    console.error(`\n❌ エラーが発生しました:`, error);
    process.exit(1);
  }
};

main();

