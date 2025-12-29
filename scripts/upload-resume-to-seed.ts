#!/usr/bin/env npx tsx
/**
 * シードユーザーに経歴書をアップロードするスクリプト
 *
 * 使用方法:
 *   npx tsx scripts/upload-resume-to-seed.ts <ファイルパス> [メールアドレス]
 *
 * 例:
 *   npx tsx scripts/upload-resume-to-seed.ts test-file/Backend_Engineer_Resume_sample.pdf
 *   npx tsx scripts/upload-resume-to-seed.ts test-file/resume.pdf seed_yamada@example.com
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// 環境変数を読み込み
config({ path: ".env.local" });

import { createTalentClient, getAppIds } from "../lib/kintone/client";
import { TALENT_FIELDS } from "../lib/kintone/fieldMapping";

const FILE_PATH = process.argv[2];
const TARGET_EMAIL = process.argv[3] || "seed_yamada@example.com";

if (!FILE_PATH) {
  console.error("❌ エラー: ファイルパスを指定してください");
  console.error("");
  console.error("使用方法:");
  console.error("  npx tsx scripts/upload-resume-to-seed.ts <ファイルパス> [メールアドレス]");
  console.error("");
  console.error("例:");
  console.error("  npx tsx scripts/upload-resume-to-seed.ts test-file/Backend_Engineer_Resume_sample.pdf");
  process.exit(1);
}

async function uploadResumeToSeed() {
  console.log("📄 シードユーザーへの経歴書アップロード開始...");
  console.log(`   対象ユーザー: ${TARGET_EMAIL}`);
  console.log(`   ファイル: ${FILE_PATH}`);
  console.log("");

  // ファイルの存在確認
  const absolutePath = path.isAbsolute(FILE_PATH) ? FILE_PATH : path.join(process.cwd(), FILE_PATH);
  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ ファイルが見つかりません: ${absolutePath}`);
    process.exit(1);
  }

  const client = createTalentClient();
  const appId = getAppIds().talent;

  try {
    // 1. 対象ユーザーのレコードを取得
    console.log("🔍 ユーザーレコードを検索中...");
    const response = await client.record.getRecords({
      app: appId,
      query: `${TALENT_FIELDS.EMAIL} = "${TARGET_EMAIL}" limit 1`,
      fields: [TALENT_FIELDS.ID, TALENT_FIELDS.FULL_NAME, TALENT_FIELDS.RESUME_FILES],
    });

    if (response.records.length === 0) {
      console.error(`❌ ユーザーが見つかりません: ${TARGET_EMAIL}`);
      process.exit(1);
    }

    const record = response.records[0] as Record<string, { value: unknown }>;
    const recordId = record[TALENT_FIELDS.ID].value as string;
    const fullName = record[TALENT_FIELDS.FULL_NAME].value as string;
    console.log(`✅ ユーザー発見: ${fullName} (ID: ${recordId})`);

    // 2. ファイルをkintoneにアップロード
    console.log("📤 ファイルをアップロード中...");
    const fileBuffer = fs.readFileSync(absolutePath);
    const fileName = path.basename(absolutePath);

    const uploadResponse = await client.file.uploadFile({
      file: {
        name: fileName,
        data: fileBuffer,
      },
    });

    console.log(`✅ ファイルアップロード成功: ${uploadResponse.fileKey}`);

    // 3. レコードを更新（経歴書フィールドにファイルを設定）
    console.log("📝 レコードを更新中...");
    await client.record.updateRecord({
      app: appId,
      id: recordId,
      record: {
        [TALENT_FIELDS.RESUME_FILES]: {
          value: [{ fileKey: uploadResponse.fileKey }],
        },
      },
    });

    console.log("");
    console.log("✅ 経歴書のアップロードが完了しました！");
    console.log(`   ユーザー: ${fullName}`);
    console.log(`   ファイル: ${fileName}`);
    console.log(`   ファイルキー: ${uploadResponse.fileKey}`);
    console.log("");
    console.log("💡 ブラウザで確認してください");

  } catch (error) {
    console.error("❌ エラー:", error);
    process.exit(1);
  }
}

uploadResumeToSeed();
