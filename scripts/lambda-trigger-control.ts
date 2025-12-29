#!/usr/bin/env tsx

/**
 * Lambda バッチのスケジュールトリガー（EventBridge）を制御するスクリプト
 *
 * 使用方法:
 *   npm run lambda:trigger:on:dev     # dev環境のトリガーを有効化
 *   npm run lambda:trigger:off:dev    # dev環境のトリガーを無効化
 *   npm run lambda:trigger:on:prod    # prod環境のトリガーを有効化
 *   npm run lambda:trigger:off:prod   # prod環境のトリガーを無効化
 *   npm run lambda:trigger:status     # 両環境のトリガー状態を表示
 */

import { execSync } from "child_process";

const AWS_REGION = "ap-northeast-1";
const STACK_NAMES = {
  dev: "proworks-recommend-batch-dev",
  prod: "proworks-recommend-batch-prod",
};

// CloudFormationスタックからEventBridgeルール名を取得
const getEventRuleName = (env: "dev" | "prod"): string => {
  try {
    const stackName = STACK_NAMES[env];
    const output = execSync(
      `aws cloudformation describe-stack-resources \
        --stack-name ${stackName} \
        --region ${AWS_REGION} \
        --query 'StackResources[?ResourceType==\`AWS::Events::Rule\`].PhysicalResourceId' \
        --output text`,
      { encoding: "utf-8" }
    ).trim();

    if (!output) {
      throw new Error(`EventBridgeルールが見つかりません: ${stackName}`);
    }

    return output;
  } catch (error) {
    console.error(`❌ ルール名の取得に失敗しました:`, error);
    throw error;
  }
};

// ルールの状態を取得
const getRuleState = (ruleName: string): string => {
  try {
    const output = execSync(
      `aws events describe-rule \
        --name "${ruleName}" \
        --region ${AWS_REGION} \
        --query 'State' \
        --output text`,
      { encoding: "utf-8" }
    ).trim();
    return output;
  } catch (error) {
    console.error(`❌ ルール状態の取得に失敗しました:`, error);
    throw error;
  }
};

// トリガーを有効化
const enableTrigger = (env: "dev" | "prod"): void => {
  const ruleName = getEventRuleName(env);
  console.log(`\n🔔 ${env}環境のトリガーを有効化中...`);
  console.log(`   ルール名: ${ruleName}`);

  try {
    execSync(
      `aws events enable-rule --name "${ruleName}" --region ${AWS_REGION}`,
      { encoding: "utf-8" }
    );
    console.log(`✅ トリガーを有効化しました`);
    console.log(`   毎日 JST 02:00 に実行されます\n`);
  } catch (error) {
    console.error(`❌ 有効化に失敗しました:`, error);
    throw error;
  }
};

// トリガーを無効化
const disableTrigger = (env: "dev" | "prod"): void => {
  const ruleName = getEventRuleName(env);
  console.log(`\n🔕 ${env}環境のトリガーを無効化中...`);
  console.log(`   ルール名: ${ruleName}`);

  try {
    execSync(
      `aws events disable-rule --name "${ruleName}" --region ${AWS_REGION}`,
      { encoding: "utf-8" }
    );
    console.log(`✅ トリガーを無効化しました`);
    console.log(`   定期実行は停止されました\n`);
  } catch (error) {
    console.error(`❌ 無効化に失敗しました:`, error);
    throw error;
  }
};

// 両環境のステータスを表示
const showStatus = (): void => {
  console.log(`\n📊 Lambda バッチ トリガー状態\n`);

  for (const env of ["dev", "prod"] as const) {
    try {
      const ruleName = getEventRuleName(env);
      const state = getRuleState(ruleName);
      const stateIcon = state === "ENABLED" ? "🟢" : "🔴";
      const stateText = state === "ENABLED" ? "有効" : "無効";
      console.log(`   ${env}: ${stateIcon} ${stateText}`);
    } catch {
      console.log(`   ${env}: ⚪ 未デプロイ`);
    }
  }
  console.log();
};

// メイン処理
const main = () => {
  const action = process.argv[2]; // 'on', 'off', 'status'
  const env = process.argv[3] as "dev" | "prod" | undefined;

  if (action === "status") {
    showStatus();
    return;
  }

  if (!action || !["on", "off"].includes(action)) {
    console.error("❌ 使用方法:");
    console.error("   npm run lambda:trigger:on:dev     # dev有効化");
    console.error("   npm run lambda:trigger:off:dev    # dev無効化");
    console.error("   npm run lambda:trigger:on:prod    # prod有効化");
    console.error("   npm run lambda:trigger:off:prod   # prod無効化");
    console.error("   npm run lambda:trigger:status     # 状態確認");
    process.exit(1);
  }

  if (!env || !["dev", "prod"].includes(env)) {
    console.error("❌ 環境を指定してください: dev または prod");
    process.exit(1);
  }

  try {
    if (action === "on") {
      enableTrigger(env);
    } else {
      disableTrigger(env);
    }
  } catch {
    process.exit(1);
  }
};

main();
