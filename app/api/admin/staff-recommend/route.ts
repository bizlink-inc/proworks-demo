/**
 * 担当者おすすめ設定API
 * POST /api/admin/staff-recommend
 *
 * 選択された人材に対して「担当者おすすめ」フラグを設定する
 * ⚠️ 重要: このAPIはRECOMMENDATION_FIELDSの定数を使用してkintoneに保存します。
 * ハードコードではなく必ず定数を参照してください。
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { verifyAdminSession } from "@/lib/admin-auth";
import { createRecommendationClient, createTalentClient, createJobClient, getAppIds } from "@/lib/kintone/client";
import { RECOMMENDATION_FIELDS, TALENT_FIELDS } from "@/lib/kintone/fieldMapping";
import { sendStaffRecommendNotificationEmail } from "@/lib/email";

// リクエスト型
type StaffRecommendRequestBody = {
  jobId: string;  // 案件のレコード番号
  talentAuthUserIds: string[];  // 選択された人材のauth_user_id配列
  recommend: boolean;  // true: おすすめ設定, false: おすすめ解除
};

// 推薦レコード型
type RecommendationRecord = {
  $id: { value: string };
  人材ID: { value: string };
  案件ID: { value: string };
  [key: string]: { value: string } | { value: string[] } | undefined;
};

// 人材レコード型
type TalentRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  氏名: { value: string };
  メールアドレス: { value: string };
};

// 案件レコード型
type JobRecord = {
  $id: { value: string };
  案件名: { value: string };
};

export const POST = async (request: NextRequest) => {
  try {
    // 認証チェック
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body: StaffRecommendRequestBody = await request.json();
    const { jobId, talentAuthUserIds, recommend } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "案件IDが指定されていません" },
        { status: 400 }
      );
    }

    if (!talentAuthUserIds || talentAuthUserIds.length === 0) {
      return NextResponse.json(
        { error: "人材が選択されていません" },
        { status: 400 }
      );
    }

    const appIds = getAppIds();
    const recommendationClient = createRecommendationClient();

    // 1. 既存の推薦レコードを取得
    console.log(`🔍 推薦レコードを検索中: 案件ID=${jobId}, 人材数=${talentAuthUserIds.length}`);
    
    const recCondition = talentAuthUserIds
      .map((id) => `${RECOMMENDATION_FIELDS.TALENT_ID} = "${id}"`)
      .join(" or ");

    const existingRecsResponse = await recommendationClient.record.getAllRecords({
      app: appIds.recommendation,
      condition: `(${recCondition}) and ${RECOMMENDATION_FIELDS.JOB_ID} = "${jobId}"`,
    });

    const existingRecs = existingRecsResponse as RecommendationRecord[];
    
    // 人材ID→レコードIDのマップ
    const recMap = new Map<string, string>();
    existingRecs.forEach((rec) => {
      recMap.set(rec[RECOMMENDATION_FIELDS.TALENT_ID]?.value as string || "", rec.$id.value);
    });

    // 2. 各人材の推薦レコードを更新
    const results: { talentAuthUserId: string; success: boolean; recommendationId: string }[] = [];
    const recommendValue = recommend ? "おすすめ" : "";

    for (const authUserId of talentAuthUserIds) {
      const existingRecId = recMap.get(authUserId);

      if (!existingRecId) {
        console.warn(`⚠️ 推薦レコードが見つかりません: ${authUserId}`);
        results.push({
          talentAuthUserId: authUserId,
          success: false,
          recommendationId: "",
        });
        continue;
      }

      try {
        // ⚠️ 重要: ここでkintoneに保存する際、必ずRECOMMENDATION_FIELDSの定数を使用してください。
        await recommendationClient.record.updateRecord({
          app: appIds.recommendation,
          id: parseInt(existingRecId, 10),
          record: {
            [RECOMMENDATION_FIELDS.STAFF_RECOMMEND]: { value: recommendValue },
          },
        });

        console.log(`✅ 担当者おすすめ${recommend ? "設定" : "解除"}完了: ${authUserId} (ID: ${existingRecId})`);
        
        results.push({
          talentAuthUserId: authUserId,
          success: true,
          recommendationId: existingRecId,
        });
      } catch (error) {
        console.error(`❌ 更新エラー: ${authUserId}`, error);
        results.push({
          talentAuthUserId: authUserId,
          success: false,
          recommendationId: existingRecId,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`🎉 担当者おすすめ${recommend ? "設定" : "解除"}完了: ${successCount}/${talentAuthUserIds.length}人`);

    // 3. おすすめ設定時のみメール通知を送信
    if (recommend && successCount > 0) {
      try {
        const talentClient = createTalentClient();
        const jobClient = createJobClient();

        // 案件情報を取得
        const jobResponse = await jobClient.record.getRecord({
          app: appIds.job,
          id: parseInt(jobId, 10),
        });
        const jobRecord = jobResponse.record as JobRecord;
        const jobTitle = jobRecord.案件名?.value || "";

        // 成功した人材のauth_user_idリスト
        const successAuthUserIds = results
          .filter((r) => r.success)
          .map((r) => r.talentAuthUserId);

        // 人材情報を取得
        const talentCondition = successAuthUserIds
          .map((id) => `${TALENT_FIELDS.AUTH_USER_ID} = "${id}"`)
          .join(" or ");

        const talentsResponse = await talentClient.record.getAllRecords({
          app: appIds.talent,
          condition: talentCondition,
          fields: ["$id", TALENT_FIELDS.AUTH_USER_ID, TALENT_FIELDS.FULL_NAME, TALENT_FIELDS.EMAIL],
        });

        const talents = talentsResponse as TalentRecord[];

        // ベースURLを取得
        const headersList = await headers();
        const host = headersList.get("host") || "localhost:3000";
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
        const jobUrl = `${baseUrl}/?jobId=${jobId}`;

        // 各人材にメール送信
        console.log(`📧 担当者おすすめ通知メール送信開始: ${talents.length}人`);
        for (const talent of talents) {
          const email = talent[TALENT_FIELDS.EMAIL as keyof TalentRecord]?.value as string;
          const userName = talent[TALENT_FIELDS.FULL_NAME as keyof TalentRecord]?.value as string || "会員";

          if (email) {
            try {
              await sendStaffRecommendNotificationEmail(
                email,
                userName,
                jobTitle,
                jobUrl,
                baseUrl
              );
              console.log(`  ✅ メール送信成功: ${email}`);
            } catch (emailError) {
              console.error(`  ❌ メール送信失敗: ${email}`, emailError);
            }
          }
        }
        console.log(`📧 担当者おすすめ通知メール送信完了`);
      } catch (emailError) {
        // メール送信エラーがあってもAPIは成功として返す
        console.error("担当者おすすめ通知メール送信エラー:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      recommend,
      results,
      stats: {
        total: talentAuthUserIds.length,
        success: successCount,
        failed: talentAuthUserIds.length - successCount,
      },
    });

  } catch (error) {
    console.error("担当者おすすめ設定エラー:", error);
    return NextResponse.json(
      { error: "担当者おすすめの設定に失敗しました" },
      { status: 500 }
    );
  }
};

