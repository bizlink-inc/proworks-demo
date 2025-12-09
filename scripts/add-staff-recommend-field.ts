/**
 * kintone推薦DBに「担当者おすすめ」フィールドを追加するスクリプト
 * 
 * 実行方法:
 *   npx tsx scripts/add-staff-recommend-field.ts
 */

import { config } from "dotenv";
import { KintoneRestAPIClient } from "@kintone/rest-api-client";

// .env.localを読み込み
config({ path: ".env.local" });

const KINTONE_BASE_URL = process.env.KINTONE_BASE_URL;
const KINTONE_RECOMMENDATION_API_TOKEN = process.env.KINTONE_RECOMMENDATION_API_TOKEN;
const KINTONE_RECOMMENDATION_APP_ID = process.env.KINTONE_RECOMMENDATION_APP_ID;

const main = async () => {
  console.log("==========================================");
  console.log("🔧 kintone 担当者おすすめフィールド追加");
  console.log("==========================================");

  if (!KINTONE_BASE_URL || !KINTONE_RECOMMENDATION_API_TOKEN || !KINTONE_RECOMMENDATION_APP_ID) {
    console.error("❌ 環境変数が設定されていません");
    console.error("   KINTONE_BASE_URL:", KINTONE_BASE_URL ? "✅" : "❌");
    console.error("   KINTONE_RECOMMENDATION_API_TOKEN:", KINTONE_RECOMMENDATION_API_TOKEN ? "✅" : "❌");
    console.error("   KINTONE_RECOMMENDATION_APP_ID:", KINTONE_RECOMMENDATION_APP_ID ? "✅" : "❌");
    process.exit(1);
  }

  console.log("📋 設定情報:");
  console.log("   Base URL:", KINTONE_BASE_URL);
  console.log("   App ID:", KINTONE_RECOMMENDATION_APP_ID);
  console.log("");

  const client = new KintoneRestAPIClient({
    baseUrl: KINTONE_BASE_URL,
    auth: {
      apiToken: KINTONE_RECOMMENDATION_API_TOKEN,
    },
  });

  const appId = parseInt(KINTONE_RECOMMENDATION_APP_ID, 10);

  try {
    // 1. 現在のフィールドを確認
    console.log("📋 現在のフィールドを確認中...");
    const currentFields = await client.app.getFormFields({
      app: appId,
    });

    if (currentFields.properties["担当者おすすめ"]) {
      console.log("⚠️ 「担当者おすすめ」フィールドは既に存在します");
      console.log("   現在の設定:", JSON.stringify(currentFields.properties["担当者おすすめ"], null, 2));
      return;
    }

    // 2. フィールドを追加（プレビュー環境）
    console.log("📝 「担当者おすすめ」フィールドを追加中...");
    
    const addResult = await client.app.addFormFields({
      app: appId,
      properties: {
        "担当者おすすめ": {
          type: "DROP_DOWN",
          code: "担当者おすすめ",
          label: "担当者おすすめ",
          noLabel: false,
          required: false,
          options: {
            "おすすめ": {
              label: "おすすめ",
              index: "0",
            },
          },
          defaultValue: "",
        },
      },
    });

    console.log("✅ フィールド追加成功（リビジョン:", addResult.revision, "）");

    // 3. 変更をデプロイ
    console.log("🚀 変更をデプロイ中...");
    
    await client.app.deployApp({
      apps: [{ app: appId }],
    });

    console.log("✅ デプロイを開始しました");

    // 4. デプロイ完了を待機
    console.log("⏳ デプロイ完了を待機中...");
    
    let deployed = false;
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const status = await client.app.getDeployStatus({
        apps: [appId],
      });
      
      const appStatus = status.apps[0];
      console.log(`   ステータス: ${appStatus.status}`);
      
      if (appStatus.status === "SUCCESS") {
        deployed = true;
        break;
      } else if (appStatus.status === "FAIL" || appStatus.status === "CANCEL") {
        throw new Error(`デプロイ失敗: ${appStatus.status}`);
      }
    }

    if (!deployed) {
      console.warn("⚠️ デプロイがタイムアウトしました。kintone管理画面で確認してください。");
    } else {
      console.log("✅ デプロイ完了！");
    }

    console.log("");
    console.log("==========================================");
    console.log("🎉 完了！");
    console.log("==========================================");

  } catch (error) {
    console.error("❌ エラー:", error);
    process.exit(1);
  }
};

main();

