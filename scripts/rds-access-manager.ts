/**
 * RDSアクセス管理スクリプト
 * 
 * 実行時に現在のIPアドレスを取得してセキュリティグループに追加し、
 * 実行後に削除することで、どの環境からでも安全にRDSに接続できるようにします。
 */

import { config } from "dotenv";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// 環境変数を読み込む
config({ path: ".env.local" });
config({ path: ".aws-resources.env" });

const RDS_SG_ID = process.env.RDS_SG_ID || "sg-05ca0ab3613477baf";
const PORT = 5432;
const TEMP_RULE_FILE = path.join(process.cwd(), ".rds-temp-rule.json");

/**
 * 現在のパブリックIPアドレスを取得
 */
const getCurrentIpAddress = (): string => {
  try {
    const ip = execSync("curl -s https://checkip.amazonaws.com", {
      encoding: "utf-8",
    }).trim();
    
    if (!ip || ip.length === 0) {
      throw new Error("IPアドレスの取得に失敗しました");
    }
    
    console.log(`✅ 現在のIPアドレス: ${ip}`);
    return ip;
  } catch (error) {
    console.error("❌ IPアドレスの取得に失敗しました:", error);
    throw error;
  }
};

/**
 * セキュリティグループにIPアドレスを追加
 */
const addIpToSecurityGroup = (ip: string): string | null => {
  try {
    console.log(`\n🔐 セキュリティグループにIPアドレスを追加中...`);
    console.log(`   セキュリティグループID: ${RDS_SG_ID}`);
    console.log(`   IPアドレス: ${ip}/32`);
    
    const command = `aws ec2 authorize-security-group-ingress \
      --group-id ${RDS_SG_ID} \
      --protocol tcp \
      --port ${PORT} \
      --cidr ${ip}/32 \
      --output json`;
    
    const result = execSync(command, { encoding: "utf-8" });
    const jsonResult = JSON.parse(result);
    
    if (jsonResult.SecurityGroupRules && jsonResult.SecurityGroupRules.length > 0) {
      const ruleId = jsonResult.SecurityGroupRules[0].SecurityGroupRuleId;
      console.log(`✅ IPアドレスを追加しました (Rule ID: ${ruleId})`);
      
      // ルールIDを一時ファイルに保存（後で削除するため）
      fs.writeFileSync(
        TEMP_RULE_FILE,
        JSON.stringify({ ruleId, ip, timestamp: new Date().toISOString() }),
        "utf-8"
      );
      
      return ruleId;
    }
    
    return null;
  } catch (error: any) {
    // 既に存在する場合はエラーを無視
    if (error.message && error.message.includes("already exists")) {
      console.log("⚠️  このIPアドレスは既に許可されています");
      return null;
    }
    
    console.error("❌ セキュリティグループへの追加に失敗しました:", error.message);
    throw error;
  }
};

/**
 * セキュリティグループからIPアドレスを削除
 */
const removeIpFromSecurityGroup = (ruleId: string): void => {
  try {
    console.log(`\n🔓 セキュリティグループからIPアドレスを削除中...`);
    console.log(`   ルールID: ${ruleId}`);
    
    const command = `aws ec2 revoke-security-group-ingress \
      --group-id ${RDS_SG_ID} \
      --security-group-rule-ids ${ruleId}`;
    
    execSync(command, { encoding: "utf-8" });
    console.log(`✅ IPアドレスを削除しました`);
    
    // 一時ファイルを削除
    if (fs.existsSync(TEMP_RULE_FILE)) {
      fs.unlinkSync(TEMP_RULE_FILE);
    }
  } catch (error: any) {
    console.error("❌ セキュリティグループからの削除に失敗しました:", error.message);
    // エラーが発生しても続行（手動で削除可能）
  }
};

/**
 * 以前の実行で残ったルールをクリーンアップ
 */
const cleanupOldRules = (): void => {
  if (!fs.existsSync(TEMP_RULE_FILE)) {
    return;
  }
  
  try {
    const ruleData = JSON.parse(fs.readFileSync(TEMP_RULE_FILE, "utf-8"));
    const ruleId = ruleData.ruleId;
    
    console.log(`\n🧹 以前の実行で残ったルールをクリーンアップ中...`);
    removeIpFromSecurityGroup(ruleId);
  } catch (error) {
    // クリーンアップに失敗しても続行
    console.log("⚠️  クリーンアップをスキップしました");
  }
};

/**
 * IPアドレスを追加（メイン処理）
 */
export const addAccess = (): string | null => {
  console.log("\n" + "=".repeat(80));
  console.log("🔐 RDSアクセス管理: IPアドレス追加");
  console.log("=".repeat(80));
  
  // 以前のルールをクリーンアップ
  cleanupOldRules();
  
  const ip = getCurrentIpAddress();
  const ruleId = addIpToSecurityGroup(ip);
  
  // 接続が確立されるまで少し待機
  console.log("\n⏳ 接続設定の反映を待機中（5秒）...");
  execSync("sleep 5", { encoding: "utf-8" });
  
  return ruleId;
};

/**
 * IPアドレスを削除（クリーンアップ）
 */
export const removeAccess = (): void => {
  console.log("\n" + "=".repeat(80));
  console.log("🔓 RDSアクセス管理: IPアドレス削除");
  console.log("=".repeat(80));
  
  if (!fs.existsSync(TEMP_RULE_FILE)) {
    console.log("⚠️  削除するルールが見つかりませんでした");
    return;
  }
  
  try {
    const ruleData = JSON.parse(fs.readFileSync(TEMP_RULE_FILE, "utf-8"));
    const ruleId = ruleData.ruleId;
    
    if (ruleId) {
      removeIpFromSecurityGroup(ruleId);
    }
  } catch (error) {
    console.error("❌ ルールの削除に失敗しました:", error);
  }
};

// コマンドライン引数で処理を分岐
const command = process.argv[2];

if (command === "add") {
  addAccess();
} else if (command === "remove") {
  removeAccess();
} else {
  console.error("使用方法:");
  console.error("  npm run rds:access:add    - IPアドレスを追加");
  console.error("  npm run rds:access:remove - IPアドレスを削除");
  process.exit(1);
}

