/**
 * 案件作成時Webhook API
 * POST /api/webhooks/job-created
 *
 * kintoneの案件DBでレコードが作成された際に呼び出されるWebhook
 * プログラムマッチを自動実行し、スコア上位のユーザーに推薦レコードを作成する
 *
 * ⚠️ kintone側でWebhookを設定する必要があります:
 * 1. kintone案件アプリの設定 → Webhook → 追加
 * 2. URL: https://your-domain.com/api/webhooks/job-created
 * 3. 通知を送信する条件: レコードの追加
 */

import { NextRequest, NextResponse } from "next/server";
import { createTalentClient, createJobClient, createRecommendationClient, getAppIds } from "@/lib/kintone/client";
import { RECOMMENDATION_FIELDS } from "@/lib/kintone/fieldMapping";
import { calculateTopMatches, TalentForMatching, JobForMatching } from "@/lib/matching/calculateScore";

// Webhookの認証用シークレット（環境変数で設定）
const WEBHOOK_SECRET = process.env.KINTONE_WEBHOOK_SECRET;

// kintone Webhookのペイロード型
type KintoneWebhookPayload = {
  id: string;
  type: string;
  app: {
    id: string;
    name: string;
  };
  record: {
    $id: { value: string };
    案件名?: { value: string };
    職種_ポジション?: { value: string[] };
    スキル?: { value: string[] };
    募集ステータス?: { value: string };
    [key: string]: { value: string | string[] } | undefined;
  };
  recordTitle?: string;
  url?: string;
};

// Kintoneレコード型
type TalentRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  氏名: { value: string };
  複数選択: { value: string[] };
  言語_ツール: { value: string };
  主な実績_PR_職務経歴: { value: string };
  希望単価_月額: { value: string };
  ST?: { value: string };
};

type RecommendationRecord = {
  $id: { value: string };
  人材ID: { value: string };
  案件ID: { value: string };
  適合スコア: { value: string };
};

export const POST = async (request: NextRequest) => {
  try {
    // Webhook認証（オプション）
    if (WEBHOOK_SECRET) {
      const authHeader = request.headers.get("X-Webhook-Secret");
      if (authHeader !== WEBHOOK_SECRET) {
        console.error("Webhook認証失敗");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const payload: KintoneWebhookPayload = await request.json();
    console.log("📥 案件作成Webhook受信:", payload.record.$id?.value);

    // レコード追加イベントのみ処理
    if (payload.type !== "ADD_RECORD") {
      console.log("⏭️ スキップ: ADD_RECORD以外のイベント", payload.type);
      return NextResponse.json({ success: true, message: "Skipped: Not ADD_RECORD" });
    }

    // クローズ案件はスキップ
    if (payload.record.募集ステータス?.value === "クローズ") {
      console.log("⏭️ スキップ: クローズ案件");
      return NextResponse.json({ success: true, message: "Skipped: Closed job" });
    }

    const jobId = payload.record.$id.value;
    const appIds = getAppIds();
    const talentClient = createTalentClient();
    const recommendationClient = createRecommendationClient();

    // 1. 案件情報を整形
    const job: JobForMatching = {
      id: jobId,
      jobId: jobId,
      title: payload.record.案件名?.value || "(案件名なし)",
      positions: (payload.record.職種_ポジション?.value as string[]) || [],
      skills: (payload.record.スキル?.value as string[]) || [],
    };

    console.log(`📋 案件情報: ${job.title} (ID: ${jobId})`);

    // 2. 全人材を取得（退会者を除く）
    const talentsResponse = await talentClient.record.getAllRecords({
      app: appIds.talent,
      condition: 'ST != "退会"',
      fields: ["$id", "auth_user_id", "氏名", "複数選択", "言語_ツール", "主な実績_PR_職務経歴", "希望単価_月額"],
    });

    const talents: TalentForMatching[] = (talentsResponse as unknown as TalentRecord[]).map((record) => ({
      id: record.$id.value,
      authUserId: record.auth_user_id?.value || "",
      name: record.氏名?.value || "(名前なし)",
      positions: record.複数選択?.value || [],
      skills: record.言語_ツール?.value || "",
      experience: record.主な実績_PR_職務経歴?.value || "",
      desiredRate: record.希望単価_月額?.value || "",
    }));

    console.log(`👥 人材数: ${talents.length}人`);

    // 3. マッチングスコアを計算（上位10人）
    const topMatches = calculateTopMatches(talents, job, 10);
    console.log(`🎯 マッチ結果: ${topMatches.length}人`);

    if (topMatches.length === 0) {
      console.log("⚠️ マッチする人材がいませんでした");
      return NextResponse.json({
        success: true,
        message: "No matching talents",
        jobId,
      });
    }

    // 4. 既存の推薦レコードを確認
    const existingRecsResponse = await recommendationClient.record.getAllRecords({
      app: appIds.recommendation,
      condition: `${RECOMMENDATION_FIELDS.JOB_ID} = "${jobId}"`,
      fields: ["$id", RECOMMENDATION_FIELDS.TALENT_ID, RECOMMENDATION_FIELDS.JOB_ID, RECOMMENDATION_FIELDS.SCORE],
    });
    const existingRecs = existingRecsResponse as unknown as RecommendationRecord[];

    const existingRecsMap = new Map<string, string>();
    for (const rec of existingRecs) {
      existingRecsMap.set(rec[RECOMMENDATION_FIELDS.TALENT_ID as keyof RecommendationRecord]?.value as string, rec.$id.value);
    }

    // 5. 推薦DBに登録/更新
    const recordsToCreate: Record<string, { value: string | number }>[] = [];
    const recordsToUpdate: { id: string; record: Record<string, { value: string | number }> }[] = [];

    for (const match of topMatches) {
      if (!match.talentAuthUserId) continue;

      const existingRecId = existingRecsMap.get(match.talentAuthUserId);

      if (existingRecId) {
        recordsToUpdate.push({
          id: existingRecId,
          record: {
            [RECOMMENDATION_FIELDS.SCORE]: { value: match.score },
          },
        });
      } else {
        recordsToCreate.push({
          [RECOMMENDATION_FIELDS.TALENT_ID]: { value: match.talentAuthUserId },
          [RECOMMENDATION_FIELDS.JOB_ID]: { value: match.jobId },
          [RECOMMENDATION_FIELDS.SCORE]: { value: match.score },
        });
      }
    }

    // 一括作成
    if (recordsToCreate.length > 0) {
      await recommendationClient.record.addRecords({
        app: appIds.recommendation,
        records: recordsToCreate,
      });
      console.log(`✅ 推薦レコード作成: ${recordsToCreate.length}件`);
    }

    // 一括更新
    if (recordsToUpdate.length > 0) {
      await recommendationClient.record.updateRecords({
        app: appIds.recommendation,
        records: recordsToUpdate,
      });
      console.log(`✅ 推薦レコード更新: ${recordsToUpdate.length}件`);
    }

    console.log(`🎉 案件作成Webhook処理完了: ${job.title}`);

    return NextResponse.json({
      success: true,
      jobId,
      jobTitle: job.title,
      stats: {
        totalTalents: talents.length,
        matchedTalents: topMatches.length,
        created: recordsToCreate.length,
        updated: recordsToUpdate.length,
      },
    });

  } catch (error) {
    console.error("案件作成Webhookエラー:", error);
    return NextResponse.json(
      { error: "Webhook処理に失敗しました" },
      { status: 500 }
    );
  }
};
