import { createTalentClient, getAppIds } from "../client";
import type { TalentRecord, Talent } from "../types";
import { FileInfo, getFileInfoFromKintone } from "./file";
import { TALENT_FIELDS } from "../fieldMapping";

// kintoneレコードをフロントエンド用の型に変換
const convertTalentRecord = (record: TalentRecord): Talent => {
  return {
    id: record[TALENT_FIELDS.ID].value,
    authUserId: record[TALENT_FIELDS.AUTH_USER_ID].value,
    lastName: record[TALENT_FIELDS.LAST_NAME].value,
    firstName: record[TALENT_FIELDS.FIRST_NAME].value,
    fullName: record[TALENT_FIELDS.FULL_NAME].value,
    lastNameKana: record[TALENT_FIELDS.LAST_NAME_KANA].value,
    firstNameKana: record[TALENT_FIELDS.FIRST_NAME_KANA].value,
    email: record[TALENT_FIELDS.EMAIL].value,
    birthDate: record[TALENT_FIELDS.BIRTH_DATE].value,
    postalCode: record[TALENT_FIELDS.POSTAL_CODE].value,
    address: record[TALENT_FIELDS.ADDRESS].value,
    phone: record[TALENT_FIELDS.PHONE].value,
    skills: record[TALENT_FIELDS.SKILLS].value,
    experience: record[TALENT_FIELDS.EXPERIENCE].value,
    resumeFiles: record[TALENT_FIELDS.RESUME_FILES].value?.map(file => ({
      fileKey: file.fileKey,
      name: file.name,
      size: parseInt(file.size, 10),
      contentType: 'application/octet-stream',
    })) || [],
    portfolioUrl: record[TALENT_FIELDS.PORTFOLIO_URL].value,
    availableFrom: record[TALENT_FIELDS.AVAILABLE_FROM].value,
    desiredRate: record[TALENT_FIELDS.DESIRED_RATE].value,
    desiredWorkDays: record[TALENT_FIELDS.DESIRED_WORK_DAYS].value,
    desiredCommute: record[TALENT_FIELDS.DESIRED_COMMUTE].value,
    desiredWorkStyle: record[TALENT_FIELDS.DESIRED_WORK_STYLE].value,
    desiredWork: record[TALENT_FIELDS.DESIRED_WORK].value,
    ngCompanies: record[TALENT_FIELDS.NG_COMPANIES].value,
    otherRequests: record[TALENT_FIELDS.OTHER_REQUESTS].value,
    // 新規登録時の同意・設定フィールド
    emailDeliveryStatus: record[TALENT_FIELDS.EMAIL_DELIVERY_STATUS]?.value || '',
    termsAgreed: record[TALENT_FIELDS.TERMS_AGREED]?.value || '',
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
  emailDeliveryStatus?: string;
  termsAgreed?: string;
}): Promise<string> => {
  const client = createTalentClient();
  const appId = getAppIds().talent;

  try {
    // 氏名の生成（空の場合はメールアドレスの@前を使用）
    const fullName = data.lastName || data.firstName 
      ? `${data.lastName} ${data.firstName}`.trim()
      : data.email.split("@")[0];

    const record: Record<string, { value: string }> = {
      auth_user_id: { value: data.authUserId },
      姓: { value: data.lastName },
      名: { value: data.firstName },
      氏名: { value: fullName },
      メールアドレス: { value: data.email },
      電話番号: { value: data.phone },
      生年月日: { value: data.birthDate },
    };

    // メール配信ステータスフィールドがある場合は追加
    if (data.emailDeliveryStatus) {
      record[TALENT_FIELDS.EMAIL_DELIVERY_STATUS] = { value: data.emailDeliveryStatus };
    }

    // 利用規約同意フィールドがある場合は追加
    if (data.termsAgreed) {
      record[TALENT_FIELDS.TERMS_AGREED] = { value: data.termsAgreed };
    }

    const response = await client.record.addRecord({
      app: appId,
      record,
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
      emailDeliveryStatus: data.emailDeliveryStatus,
      termsAgreed: data.termsAgreed,
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

  if (data.lastName !== undefined) record[TALENT_FIELDS.LAST_NAME] = { value: data.lastName };
  if (data.firstName !== undefined) record[TALENT_FIELDS.FIRST_NAME] = { value: data.firstName };
  if (data.fullName !== undefined) record[TALENT_FIELDS.FULL_NAME] = { value: data.fullName };
  if (data.lastNameKana !== undefined) record[TALENT_FIELDS.LAST_NAME_KANA] = { value: data.lastNameKana };
  if (data.firstNameKana !== undefined) record[TALENT_FIELDS.FIRST_NAME_KANA] = { value: data.firstNameKana };
  if (data.email !== undefined) record[TALENT_FIELDS.EMAIL] = { value: data.email };
  if (data.birthDate !== undefined) record[TALENT_FIELDS.BIRTH_DATE] = { value: data.birthDate };
  if (data.postalCode !== undefined) record[TALENT_FIELDS.POSTAL_CODE] = { value: data.postalCode };
  if (data.address !== undefined) record[TALENT_FIELDS.ADDRESS] = { value: data.address };
  if (data.phone !== undefined) record[TALENT_FIELDS.PHONE] = { value: data.phone };
  if (data.skills !== undefined) record[TALENT_FIELDS.SKILLS] = { value: data.skills };
  if (data.experience !== undefined) record[TALENT_FIELDS.EXPERIENCE] = { value: data.experience };
  if (data.resumeFiles !== undefined) {
    record[TALENT_FIELDS.RESUME_FILES] = {
      value: data.resumeFiles.map(file => ({
        fileKey: file.fileKey,
        name: file.name,
        size: file.size.toString(),
      }))
    };
  }
  if (data.portfolioUrl !== undefined) record[TALENT_FIELDS.PORTFOLIO_URL] = { value: data.portfolioUrl };
  if (data.availableFrom !== undefined) record[TALENT_FIELDS.AVAILABLE_FROM] = { value: data.availableFrom };
  if (data.desiredRate !== undefined) record[TALENT_FIELDS.DESIRED_RATE] = { value: data.desiredRate };
  if (data.desiredWorkDays !== undefined) record[TALENT_FIELDS.DESIRED_WORK_DAYS] = { value: data.desiredWorkDays };
  if (data.desiredCommute !== undefined) record[TALENT_FIELDS.DESIRED_COMMUTE] = { value: data.desiredCommute };
  if (data.desiredWorkStyle !== undefined) record[TALENT_FIELDS.DESIRED_WORK_STYLE] = { value: data.desiredWorkStyle };
  if (data.desiredWork !== undefined) record[TALENT_FIELDS.DESIRED_WORK] = { value: data.desiredWork };
  if (data.ngCompanies !== undefined) record[TALENT_FIELDS.NG_COMPANIES] = { value: data.ngCompanies };
  if (data.otherRequests !== undefined) record[TALENT_FIELDS.OTHER_REQUESTS] = { value: data.otherRequests };
  // 新規登録時の同意・設定フィールド
  if (data.emailDeliveryStatus !== undefined) record[TALENT_FIELDS.EMAIL_DELIVERY_STATUS] = { value: data.emailDeliveryStatus };
  if (data.termsAgreed !== undefined) record[TALENT_FIELDS.TERMS_AGREED] = { value: data.termsAgreed };

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

