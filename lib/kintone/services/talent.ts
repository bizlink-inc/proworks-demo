import { createTalentClient, getAppIds } from "../client";
import type { TalentRecord, Talent } from "../types";
import { FileInfo, getFileInfoFromKintone } from "./file";

// kintoneレコードをフロントエンド用の型に変換
const convertTalentRecord = (record: TalentRecord): Talent => {
  return {
    id: record.$id.value,
    authUserId: record.auth_user_id.value,
    lastName: record.姓.value,
    firstName: record.名.value,
    fullName: record.氏名.value,
    fullNameKana: record.氏名_フリガナ.value,
    email: record.メールアドレス.value,
    birthDate: record.生年月日.value,
    postalCode: record.郵便番号.value,
    address: record.住所.value,
    phone: record.電話番号.value,
    skills: record.言語_ツール.value,
    experience: record.主な実績_PR_職務経歴.value,
    resumeFiles: record.職務経歴書データ.value?.map(file => ({
      fileKey: file.fileKey,
      name: file.name,
      size: parseInt(file.size, 10),
      contentType: 'application/octet-stream', // kintoneから取得できない場合のデフォルト
    })) || [],
    portfolioUrl: record.ポートフォリオリンク.value,
    availableFrom: record.稼働可能時期.value,
    desiredRate: record.希望単価_月額.value,
    desiredWorkDays: record.希望勤務日数.value,
    desiredCommute: record.希望出社頻度.value,
    desiredWorkStyle: record.希望勤務スタイル.value,
    desiredWork: record.希望案件_作業内容.value,
    ngCompanies: record.NG企業.value,
    otherRequests: record.その他要望.value,
  };
};

// auth_user_idでタレント情報を取得
export const getTalentByAuthUserId = async (authUserId: string): Promise<Talent | null> => {
  const client = createTalentClient();
  const appId = getAppIds().talent;

  try {
    const response = await client.record.getRecords({
      app: appId,
      query: `auth_user_id = "${authUserId}"`,
    });

    if (response.records.length === 0) {
      return null;
    }

    return convertTalentRecord(response.records[0] as TalentRecord);
  } catch (error) {
    console.error("タレント情報の取得に失敗:", error);
    throw error;
  }
};

// タレント情報を作成
export const createTalent = async (data: {
  authUserId: string;
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  birthDate: string;
}): Promise<string> => {
  const client = createTalentClient();
  const appId = getAppIds().talent;

  try {
    // 氏名の生成（空の場合はメールアドレスの@前を使用）
    const fullName = data.lastName || data.firstName 
      ? `${data.lastName} ${data.firstName}`.trim()
      : data.email.split("@")[0];

    const response = await client.record.addRecord({
      app: appId,
      record: {
        auth_user_id: { value: data.authUserId },
        姓: { value: data.lastName },
        名: { value: data.firstName },
        氏名: { value: fullName },
        メールアドレス: { value: data.email },
        電話番号: { value: data.phone },
        生年月日: { value: data.birthDate },
      },
    });

    return response.id;
  } catch (error) {
    console.error("タレント情報の作成に失敗:", error);
    console.error("エラー詳細:", JSON.stringify(error, null, 2));
    console.error("送信データ:", {
      appId,
      authUserId: data.authUserId,
      lastName: data.lastName,
      firstName: data.firstName,
      email: data.email,
      phone: data.phone,
      birthDate: data.birthDate,
    });
    throw error;
  }
};

// タレント情報を更新
export const updateTalent = async (
  recordId: string,
  data: Partial<Omit<Talent, "id" | "authUserId">>
): Promise<void> => {
  const client = createTalentClient();
  const appId = getAppIds().talent;

  const record: Record<string, { value: unknown }> = {};

  if (data.lastName !== undefined) record.姓 = { value: data.lastName };
  if (data.firstName !== undefined) record.名 = { value: data.firstName };
  if (data.fullName !== undefined) record.氏名 = { value: data.fullName };
  if (data.fullNameKana !== undefined) record.氏名_フリガナ = { value: data.fullNameKana };
  if (data.email !== undefined) record.メールアドレス = { value: data.email };
  if (data.birthDate !== undefined) record.生年月日 = { value: data.birthDate };
  if (data.postalCode !== undefined) record.郵便番号 = { value: data.postalCode };
  if (data.address !== undefined) record.住所 = { value: data.address };
  if (data.phone !== undefined) record.電話番号 = { value: data.phone };
  if (data.skills !== undefined) record.言語_ツール = { value: data.skills };
  if (data.experience !== undefined) record.主な実績_PR_職務経歴 = { value: data.experience };
  if (data.resumeFiles !== undefined) {
    record.職務経歴書データ = {
      value: data.resumeFiles.map(file => ({
        fileKey: file.fileKey,
        name: file.name,
        size: file.size.toString(),
      }))
    };
  }
  if (data.portfolioUrl !== undefined) record.ポートフォリオリンク = { value: data.portfolioUrl };
  if (data.availableFrom !== undefined) record.稼働可能時期 = { value: data.availableFrom };
  if (data.desiredRate !== undefined) record.希望単価_月額 = { value: data.desiredRate };
  if (data.desiredWorkDays !== undefined) record.希望勤務日数 = { value: data.desiredWorkDays };
  if (data.desiredCommute !== undefined) record.希望出社頻度 = { value: data.desiredCommute };
  if (data.desiredWorkStyle !== undefined) record.希望勤務スタイル = { value: data.desiredWorkStyle };
  if (data.desiredWork !== undefined) record.希望案件_作業内容 = { value: data.desiredWork };
  if (data.ngCompanies !== undefined) record.NG企業 = { value: data.ngCompanies };
  if (data.otherRequests !== undefined) record.その他要望 = { value: data.otherRequests };

  try {
    await client.record.updateRecord({
      app: appId,
      id: recordId,
      record,
    });
  } catch (error) {
    console.error("タレント情報の更新に失敗:", error);
    throw error;
  }
};

// 添付ファイルをアップロード
export const uploadResumeFile = async (file: File): Promise<string> => {
  const client = createTalentClient();

  try {
    const response = await client.file.uploadFile({
      file: {
        name: file.name,
        data: file,
      },
    });

    return response.fileKey;
  } catch (error) {
    console.error("ファイルのアップロードに失敗:", error);
    throw error;
  }
};

// 添付ファイルを更新
export const updateResumeFiles = async (recordId: string, fileKeys: string[]): Promise<void> => {
  const client = createTalentClient();
  const appId = getAppIds().talent;

  try {
    await client.record.updateRecord({
      app: appId,
      id: recordId,
      record: {
        職務経歴データ: {
          value: fileKeys.map((key) => ({ fileKey: key })),
        },
      },
    });
  } catch (error) {
    console.error("添付ファイルの更新に失敗:", error);
    throw error;
  }
};

