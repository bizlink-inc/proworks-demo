/**
 * 通知テスト用APIエンドポイント（開発環境専用）
 * POST /api/test/notification
 *
 * テストスクリプトから呼び出され、メール送信のログをNext.jsサーバーのコンソールに出力する
 * ⚠️ 開発環境（NODE_ENV=development）でのみ動作
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createTalentClient,
  createJobClient,
  createRecommendationClient,
  getAppIds,
} from "@/lib/kintone/client";
import { RECOMMENDATION_FIELDS, TALENT_FIELDS } from "@/lib/kintone/fieldMapping";
import {
  sendStaffRecommendNotificationEmail,
  sendAIMatchNotificationEmail,
} from "@/lib/email";

// リクエスト型
type TestNotificationRequestBody = {
  mode: "staff" | "ai" | "both";
  talentAuthUserId: string;
  jobId?: string; // 指定がなければ最初の募集中案件を使用
};

// 型定義
type TalentRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  氏名: { value: string };
  メールアドレス: { value: string };
};

type JobRecord = {
  $id: { value: string };
  案件名: { value: string };
  募集ステータス?: { value: string };
};

type RecommendationRecord = {
  $id: { value: string };
  人材ID: { value: string };
  案件ID: { value: string };
};

export const POST = async (request: NextRequest) => {
  // 開発環境チェック
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "このエンドポイントは開発環境でのみ使用できます" },
      { status: 403 }
    );
  }

  try {
    const body: TestNotificationRequestBody = await request.json();
    const { mode, talentAuthUserId, jobId: requestedJobId } = body;

    console.log("\n" + "=".repeat(80));
    console.log("🔔 通知テストAPI（開発環境専用）");
    console.log("=".repeat(80));
    console.log(`📋 対象ユーザー: ${talentAuthUserId}`);
    console.log(`📋 実行モード: ${mode}`);
    console.log("");

    const appIds = getAppIds();
    const talentClient = createTalentClient();
    const jobClient = createJobClient();
    const recommendationClient = createRecommendationClient();

    // 1. 人材情報を取得
    console.log("📌 Step 1: 人材情報を取得");
    console.log("-".repeat(40));

    const talentResponse = await talentClient.record.getAllRecords({
      app: appIds.talent,
      condition: `${TALENT_FIELDS.AUTH_USER_ID} = "${talentAuthUserId}"`,
      fields: ["$id", TALENT_FIELDS.AUTH_USER_ID, TALENT_FIELDS.FULL_NAME, TALENT_FIELDS.EMAIL],
    });

    if (talentResponse.length === 0) {
      return NextResponse.json(
        { error: `人材が見つかりません: ${talentAuthUserId}` },
        { status: 404 }
      );
    }

    const talent = talentResponse[0] as unknown as TalentRecord;
    const talentEmail = talent[TALENT_FIELDS.EMAIL as keyof TalentRecord]?.value as string;
    const talentName = talent[TALENT_FIELDS.FULL_NAME as keyof TalentRecord]?.value as string || "会員";

    console.log(`  ✅ 人材を発見`);
    console.log(`     名前: ${talentName}`);
    console.log(`     メール: ${talentEmail}`);
    console.log("");

    // 2. 案件を取得
    console.log("📌 Step 2: テスト対象の案件を取得");
    console.log("-".repeat(40));

    let jobId = requestedJobId;
    let jobTitle = "";

    if (jobId) {
      // 指定された案件を取得
      const jobResponse = await jobClient.record.getRecord({
        app: appIds.job,
        id: parseInt(jobId, 10),
      });
      const job = jobResponse.record as unknown as JobRecord;
      jobTitle = job.案件名?.value || "";
    } else {
      // 最初の募集中案件を使用
      const jobsResponse = await jobClient.record.getAllRecords({
        app: appIds.job,
        condition: '募集ステータス in ("募集中")',
        fields: ["$id", "案件名", "募集ステータス"],
        orderBy: "$id asc",
      });

      if (jobsResponse.length === 0) {
        return NextResponse.json(
          { error: "募集中の案件が見つかりません" },
          { status: 404 }
        );
      }

      const targetJob = jobsResponse[0] as unknown as JobRecord;
      jobId = targetJob.$id.value;
      jobTitle = targetJob.案件名?.value || "";
    }

    console.log(`  ✅ テスト対象案件を選択`);
    console.log(`     案件ID: ${jobId}`);
    console.log(`     案件名: ${jobTitle}`);
    console.log("");

    // 3. 推薦レコードを新規作成（既存があれば削除）
    console.log("📌 Step 3: 推薦レコードを新規作成");
    console.log("-".repeat(40));

    const existingRecResponse = await recommendationClient.record.getAllRecords({
      app: appIds.recommendation,
      condition: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${talentAuthUserId}" and ${RECOMMENDATION_FIELDS.JOB_ID} = "${jobId}"`,
    });

    // 既存レコードがあれば削除
    if (existingRecResponse.length > 0) {
      const existingRec = existingRecResponse[0] as unknown as RecommendationRecord;
      const existingRecId = existingRec.$id.value;
      console.log(`  🗑️  既存の推薦レコードを削除 (ID: ${existingRecId})`);
      await recommendationClient.record.deleteRecords({
        app: appIds.recommendation,
        ids: [parseInt(existingRecId, 10)],
      });
    }

    // 新規作成
    const createResult = await recommendationClient.record.addRecord({
      app: appIds.recommendation,
      record: {
        [RECOMMENDATION_FIELDS.TALENT_ID]: { value: talentAuthUserId },
        [RECOMMENDATION_FIELDS.JOB_ID]: { value: jobId },
        [RECOMMENDATION_FIELDS.SCORE]: { value: "85" },
      },
    });
    const recommendationId = createResult.id;
    console.log(`  ✅ 新規推薦レコードを作成 (ID: ${recommendationId})`);
    console.log("");

    // ベースURL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const jobUrl = `${baseUrl}/?jobId=${jobId}`;

    // 4. 担当者おすすめを設定
    if (mode === "staff" || mode === "both") {
      console.log("📌 Step 4: 担当者おすすめを設定");
      console.log("-".repeat(40));

      await recommendationClient.record.updateRecord({
        app: appIds.recommendation,
        id: parseInt(recommendationId, 10),
        record: {
          [RECOMMENDATION_FIELDS.STAFF_RECOMMEND]: { value: "おすすめ" },
        },
      });
      console.log(`  ✅ 担当者おすすめを設定しました`);

      // メール送信
      console.log(`  📧 担当者おすすめ通知メールを送信中...`);
      try {
        await sendStaffRecommendNotificationEmail(
          talentEmail,
          talentName,
          jobTitle,
          jobUrl,
          baseUrl
        );
        console.log(`  ✅ メール送信成功: ${talentEmail}`);
      } catch (emailError) {
        console.error(`  ❌ メール送信失敗:`, emailError);
      }
      console.log("");
    }

    // 5. AIマッチを実行
    if (mode === "ai" || mode === "both") {
      console.log("📌 Step 5: AIマッチを実行");
      console.log("-".repeat(40));

      const now = new Date().toISOString();
      await recommendationClient.record.updateRecord({
        app: appIds.recommendation,
        id: parseInt(recommendationId, 10),
        record: {
          AIマッチ実行状況: { value: "実行済み" },
          AI技術スキルスコア: { value: "85" },
          AI開発工程スコア: { value: "80" },
          AIインフラスコア: { value: "75" },
          AI業務知識スコア: { value: "70" },
          AIチーム開発スコア: { value: "90" },
          AIツール環境スコア: { value: "85" },
          AI総合スコア: { value: "81" },
          AI評価結果: { value: "テスト用のAI評価結果です。" },
          AI実行日時: { value: now },
        },
      });
      console.log(`  ✅ AIマッチ結果を保存しました`);

      // メール送信
      console.log(`  📧 AIマッチ通知メールを送信中...`);
      try {
        await sendAIMatchNotificationEmail(
          talentEmail,
          talentName,
          jobTitle,
          jobUrl,
          baseUrl
        );
        console.log(`  ✅ メール送信成功: ${talentEmail}`);
      } catch (emailError) {
        console.error(`  ❌ メール送信失敗:`, emailError);
      }
      console.log("");
    }

    // 完了
    console.log("=".repeat(80));
    console.log("🎉 通知テスト完了！");
    console.log("=".repeat(80));
    console.log("");

    return NextResponse.json({
      success: true,
      talent: {
        authUserId: talentAuthUserId,
        name: talentName,
        email: talentEmail,
      },
      job: {
        id: jobId,
        title: jobTitle,
      },
      recommendationId,
      mode,
    });
  } catch (error) {
    console.error("❌ 通知テストエラー:", error);
    return NextResponse.json(
      { error: "通知テストに失敗しました", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
};
