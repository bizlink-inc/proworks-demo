import { createInquiryClient, getAppIds } from "../client";
import { INQUIRY_FIELDS } from "../fieldMapping";

// 問い合わせデータの型
export type InquiryData = {
  category: "問い合わせ" | "退会申請";
  userId: string; // ルックアップキー（auth_user_id）
  // 問い合わせ用
  inquiryCategory?: string;
  inquiryContent?: string;
  // 退会用
  withdrawalReason?: string;
  withdrawalReasonDetail?: string;
  confirmationAgreed?: boolean;
};

// 問い合わせを登録
export const createInquiry = async (data: InquiryData): Promise<string> => {
  const client = createInquiryClient();
  const appId = getAppIds().inquiry;

  if (!appId) {
    throw new Error("KINTONE_INQUIRY_APP_ID is not defined");
  }

  try {
    const now = new Date().toISOString();

    // ルックアップフィールドのため、ユーザーIDのみ設定（氏名は自動取得）
    const record: Record<string, { value: unknown }> = {
      [INQUIRY_FIELDS.CATEGORY]: { value: data.category },
      [INQUIRY_FIELDS.RECEIVED_AT]: { value: now },
      [INQUIRY_FIELDS.USER_ID]: { value: data.userId },
      [INQUIRY_FIELDS.STATUS]: { value: "未対応" },
    };

    // 問い合わせ用フィールド
    if (data.category === "問い合わせ") {
      if (data.inquiryCategory) {
        record[INQUIRY_FIELDS.INQUIRY_CATEGORY] = { value: data.inquiryCategory };
      }
      if (data.inquiryContent) {
        record[INQUIRY_FIELDS.INQUIRY_CONTENT] = { value: data.inquiryContent };
      }
    }

    // 退会用フィールド
    if (data.category === "退会申請") {
      if (data.withdrawalReason) {
        record[INQUIRY_FIELDS.WITHDRAWAL_REASON] = { value: data.withdrawalReason };
      }
      if (data.withdrawalReasonDetail) {
        record[INQUIRY_FIELDS.WITHDRAWAL_REASON_DETAIL] = { value: data.withdrawalReasonDetail };
      }
      if (data.confirmationAgreed) {
        record[INQUIRY_FIELDS.CONFIRMATION_AGREED] = { value: ["3項目すべて同意済み"] };
      }
    }

    const response = await client.record.addRecord({
      app: appId,
      record,
    });

    console.log(`✅ ${data.category}を登録しました: ID=${response.id}`);
    return response.id;
  } catch (error) {
    console.error(`❌ ${data.category}の登録に失敗:`, error);
    throw error;
  }
};

// 退会申請のステータスを完了に更新
export const markWithdrawalCompleted = async (recordId: string): Promise<void> => {
  const client = createInquiryClient();
  const appId = getAppIds().inquiry;

  if (!appId) {
    throw new Error("KINTONE_INQUIRY_APP_ID is not defined");
  }

  try {
    await client.record.updateRecord({
      app: appId,
      id: recordId,
      record: {
        [INQUIRY_FIELDS.STATUS]: { value: "完了" },
      },
    });

    console.log(`✅ 退会申請ステータスを完了に更新しました: ID=${recordId}`);
  } catch (error) {
    console.error("❌ 退会申請ステータスの更新に失敗:", error);
    throw error;
  }
};
