/**
 * シードデータ用ユーティリティ関数
 */

import fs from "fs";
import path from "path";
import { uploadFileToKintone } from "../lib/kintone/services/file";
import { JOB_FIELD_OPTIONS } from "./seed-data-options";

/** ランダムID生成（Better Auth互換） */
export const generateId = (length: number = 32): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
};

/** 開発環境用の作成日時を生成（N日前） */
export const generateDevCreatedAt = (daysAgo: number): string => {
  const now = new Date();
  const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return targetDate.toISOString().replace(/\.\d{3}Z$/, "Z");
};

/** 選択肢をフィルタリング（kintoneに存在する値のみ） */
export const filterValidOptions = (
  values: string[],
  validOptions: readonly string[]
): string[] => values.filter((v) => validOptions.includes(v as any));

/** 職種・スキル・案件特徴のフィルタリング */
export const filterJobOptions = (job: {
  職種_ポジション: string[];
  スキル: string[];
  案件特徴: string[];
}) => ({
  positions: filterValidOptions(job.職種_ポジション, JOB_FIELD_OPTIONS.職種_ポジション),
  skills: filterValidOptions(job.スキル, JOB_FIELD_OPTIONS.スキル),
  features: filterValidOptions(job.案件特徴, JOB_FIELD_OPTIONS.案件特徴),
});

/** 日付をyyyy-MM-dd形式に変換 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** ダミーファイルアップロード */
export const uploadDummyFiles = async (): Promise<
  Array<{ fileKey: string; name: string; size: string }>
> => {
  const dummyFilesDir = path.join(process.cwd(), "scripts", "dummy-files");
  const uploadedFiles: Array<{ fileKey: string; name: string; size: string }> = [];

  const dummyFiles = [
    {
      filename: "職務経歴書_山田太郎.pdf",
      displayName: "職務経歴書_山田太郎.pdf",
      contentType: "application/pdf",
    },
  ];

  for (const dummyFile of dummyFiles) {
    const filePath = path.join(dummyFilesDir, dummyFile.filename);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ ダミーファイルが見つかりません: ${filePath}`);
      continue;
    }

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const file = new File([fileBuffer], dummyFile.displayName, {
        type: dummyFile.contentType,
      });

      console.log(`📤 ダミーファイルアップロード中: ${dummyFile.displayName}`);
      const uploadResult = await uploadFileToKintone(file);

      uploadedFiles.push({
        fileKey: uploadResult.fileKey,
        name: uploadResult.fileName,
        size: uploadResult.fileSize.toString(),
      });

      console.log(`✅ アップロード成功: ${dummyFile.displayName} (${uploadResult.fileKey})`);
    } catch (fileError) {
      console.error(`❌ ファイルアップロードエラー (${dummyFile.displayName}):`, fileError);
    }
  }

  return uploadedFiles;
};

/** 職務経歴書PDFをアップロード */
export const uploadResumeFile = async (
  relativePath: string
): Promise<Array<{ fileKey: string; name: string; size: string }>> => {
  try {
    const resumePath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(resumePath)) {
      return [];
    }

    const fileBuffer = fs.readFileSync(resumePath);
    const fileName = path.basename(resumePath);
    const resumeFile = new File([fileBuffer], fileName, {
      type: "application/pdf",
    });

    const uploadResult = await uploadFileToKintone(resumeFile);
    return [
      {
        fileKey: uploadResult.fileKey,
        name: uploadResult.fileName,
        size: uploadResult.fileSize.toString(),
      },
    ];
  } catch {
    return [];
  }
};

/** バッチ処理でレコードを追加 */
export const addRecordsInBatches = async <T>(
  addFn: (records: T[]) => Promise<void>,
  records: T[],
  batchSize: number = 100
): Promise<void> => {
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    await addFn(batch);
  }
};

/** バッチ処理でレコードを削除 */
export const deleteRecordsInBatches = async (
  deleteFn: (ids: number[]) => Promise<void>,
  ids: string[],
  batchSize: number = 100
): Promise<void> => {
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize).map((id) => parseInt(id, 10));
    await deleteFn(batch);
  }
};
