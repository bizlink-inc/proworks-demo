/**
 * kintoneの各アプリのフィールド一覧を取得するスクリプト
 * 
 * 使用方法:
 *   npm run get-fields
 */

// 環境変数を読み込む
import { config } from "dotenv";
config({ path: ".env.local" });

import { createTalentClient, createJobClient, createApplicationClient, getAppIds } from "../lib/kintone/client";

const getFields = async () => {
  console.log("\n🔍 kintoneフィールド一覧を取得します\n");

  try {
    const appIds = getAppIds();

    // 1. 人材DBのフィールド取得
    console.log("=" .repeat(80));
    console.log("📋 人材DB (Talent App) のフィールド一覧");
    console.log("=" .repeat(80));
    console.log(`App ID: ${appIds.talent}\n`);

    const talentClient = createTalentClient();
    const talentFields = await talentClient.app.getFormFields({ app: appIds.talent });

    console.log("フィールド数:", Object.keys(talentFields.properties).length);
    console.log("\n【フィールド詳細】\n");

    Object.entries(talentFields.properties).forEach(([fieldCode, field]: [string, any]) => {
      console.log(`フィールドコード: ${fieldCode}`);
      console.log(`  ラベル: ${field.label}`);
      console.log(`  タイプ: ${field.type}`);
      
      if (field.type === "SUBTABLE") {
        console.log(`  サブテーブルフィールド:`);
        Object.entries(field.fields).forEach(([subFieldCode, subField]: [string, any]) => {
          console.log(`    - ${subFieldCode}: ${subField.label} (${subField.type})`);
        });
      }
      
      if (field.lookup) {
        console.log(`  ルックアップ: アプリ ${field.lookup.relatedApp.app} の ${field.lookup.relatedKeyField} を参照`);
      }
      
      if (field.referenceTable) {
        console.log(`  関連レコード一覧: アプリ ${field.referenceTable.relatedApp.app} を参照`);
      }
      
      if (field.type === "CHECK_BOX" || field.type === "MULTI_SELECT" || field.type === "RADIO_BUTTON" || field.type === "DROP_DOWN") {
        console.log(`  選択肢: ${Object.keys(field.options || {}).join(", ")}`);
      }
      
      console.log(`  必須: ${field.required ? "Yes" : "No"}`);
      console.log("");
    });

    // 2. 案件DBのフィールド取得
    console.log("=" .repeat(80));
    console.log("📋 案件DB (Job App) のフィールド一覧");
    console.log("=" .repeat(80));
    console.log(`App ID: ${appIds.job}\n`);

    const jobClient = createJobClient();
    const jobFields = await jobClient.app.getFormFields({ app: appIds.job });

    console.log("フィールド数:", Object.keys(jobFields.properties).length);
    console.log("\n【フィールド詳細】\n");

    Object.entries(jobFields.properties).forEach(([fieldCode, field]: [string, any]) => {
      console.log(`フィールドコード: ${fieldCode}`);
      console.log(`  ラベル: ${field.label}`);
      console.log(`  タイプ: ${field.type}`);
      
      if (field.type === "SUBTABLE") {
        console.log(`  サブテーブルフィールド:`);
        Object.entries(field.fields).forEach(([subFieldCode, subField]: [string, any]) => {
          console.log(`    - ${subFieldCode}: ${subField.label} (${subField.type})`);
        });
      }
      
      if (field.lookup) {
        console.log(`  ルックアップ: アプリ ${field.lookup.relatedApp.app} の ${field.lookup.relatedKeyField} を参照`);
      }
      
      if (field.referenceTable) {
        console.log(`  関連レコード一覧: アプリ ${field.referenceTable.relatedApp.app} を参照`);
      }
      
      if (field.type === "CHECK_BOX" || field.type === "MULTI_SELECT" || field.type === "RADIO_BUTTON" || field.type === "DROP_DOWN") {
        console.log(`  選択肢: ${Object.keys(field.options || {}).join(", ")}`);
      }
      
      console.log(`  必須: ${field.required ? "Yes" : "No"}`);
      console.log("");
    });

    // 3. 応募履歴DBのフィールド取得
    console.log("=" .repeat(80));
    console.log("📋 応募履歴DB (Application App) のフィールド一覧");
    console.log("=" .repeat(80));
    console.log(`App ID: ${appIds.application}\n`);

    const applicationClient = createApplicationClient();
    const applicationFields = await applicationClient.app.getFormFields({ app: appIds.application });

    console.log("フィールド数:", Object.keys(applicationFields.properties).length);
    console.log("\n【フィールド詳細】\n");

    Object.entries(applicationFields.properties).forEach(([fieldCode, field]: [string, any]) => {
      console.log(`フィールドコード: ${fieldCode}`);
      console.log(`  ラベル: ${field.label}`);
      console.log(`  タイプ: ${field.type}`);
      
      if (field.type === "SUBTABLE") {
        console.log(`  サブテーブルフィールド:`);
        Object.entries(field.fields).forEach(([subFieldCode, subField]: [string, any]) => {
          console.log(`    - ${subFieldCode}: ${subField.label} (${subField.type})`);
        });
      }
      
      if (field.lookup) {
        console.log(`  ルックアップ: アプリ ${field.lookup.relatedApp.app} の ${field.lookup.relatedKeyField} を参照`);
      }
      
      if (field.referenceTable) {
        console.log(`  関連レコード一覧: アプリ ${field.referenceTable.relatedApp.app} を参照`);
      }
      
      if (field.type === "CHECK_BOX" || field.type === "MULTI_SELECT" || field.type === "RADIO_BUTTON" || field.type === "DROP_DOWN") {
        console.log(`  選択肢: ${Object.keys(field.options || {}).join(", ")}`);
      }
      
      console.log(`  必須: ${field.required ? "Yes" : "No"}`);
      console.log("");
    });

    console.log("=" .repeat(80));
    console.log("✅ フィールド一覧の取得が完了しました");
    console.log("=" .repeat(80));

    // JSON形式でも出力
    console.log("\n\n📄 JSON形式の出力 (fields-data.json に保存します)\n");

    const fieldsData = {
      talent: talentFields.properties,
      job: jobFields.properties,
      application: applicationFields.properties,
    };

    const fs = require("fs");
    fs.writeFileSync(
      "./fields-data.json",
      JSON.stringify(fieldsData, null, 2),
      "utf-8"
    );

    console.log("✅ fields-data.json に保存しました");

  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
      console.error("スタックトレース:", error.stack);
    }
    process.exit(1);
  }
};

getFields();

