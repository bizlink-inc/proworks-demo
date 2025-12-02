/**
 * AIマッチ実行API
 * POST /api/admin/ai-match
 * 
 * 選択された人材に対してAI評価を実行し、
 * 結果をKintone推薦DBに保存する
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { createTalentClient, createJobClient, createRecommendationClient, getAppIds } from "@/lib/kintone/client";
import { executeAIMatch, AIMatchResult } from "@/lib/gemini/client";

// リクエスト型
type AIMatchRequestBody = {
  jobId: string;  // 案件のレコード番号
  talentAuthUserIds: string[];  // 選択された人材のauth_user_id配列
};

// 人材レコード型
type TalentRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  氏名: { value: string };
  複数選択: { value: string[] };
  言語_ツール: { value: string };
  主な実績_PR_職務経歴: { value: string };
  希望案件_作業内容: { value: string };
};

// 案件レコード型
type JobRecord = {
  $id: { value: string };
  案件名: { value: string };
  職種_ポジション: { value: string[] };
  スキル: { value: string[] };
  必須スキル: { value: string };
  尚可スキル: { value: string };
  概要: { value: string };
  環境: { value: string };
  備考: { value: string };
};

// 推薦レコード型
type RecommendationRecord = {
  $id: { value: string };
  人材ID: { value: string };
  案件ID: { value: string };
  適合スコア: { value: string };
  AIマッチ実行状況?: { value: string };
  AI技術スキルスコア?: { value: string };
  AI開発工程スコア?: { value: string };
  AIインフラスコア?: { value: string };
  AI業務知識スコア?: { value: string };
  AIチーム開発スコア?: { value: string };
  AIツール環境スコア?: { value: string };
  AI総合スコア?: { value: string };
  AI評価結果?: { value: string };
  AI実行日時?: { value: string };
};

// レスポンス用の結果型
type AIMatchResultResponse = {
  talentAuthUserId: string;
  talentName: string;
  result: AIMatchResult;
  recommendationId: string;
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

    const body: AIMatchRequestBody = await request.json();
    const { jobId, talentAuthUserIds } = body;

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
    const talentClient = createTalentClient();
    const jobClient = createJobClient();
    const recommendationClient = createRecommendationClient();

    // 1. 案件情報を取得
    console.log(`📋 案件情報を取得: ${jobId}`);
    let jobRecord: JobRecord;
    
    try {
      const jobResponse = await jobClient.record.getRecord({
        app: appIds.job,
        id: parseInt(jobId, 10),
      });
      jobRecord = jobResponse.record as JobRecord;
    } catch (error) {
      console.error("案件取得エラー:", error);
      return NextResponse.json(
        { error: "指定された案件が見つかりません" },
        { status: 404 }
      );
    }

    // 2. 選択された人材情報を取得
    console.log(`👥 人材情報を取得: ${talentAuthUserIds.length}人`);
    const talentCondition = talentAuthUserIds
      .map((id) => `auth_user_id = "${id}"`)
      .join(" or ");

    const talentsResponse = await talentClient.record.getAllRecords({
      app: appIds.talent,
      condition: talentCondition,
    });

    const talents = talentsResponse as TalentRecord[];
    
    // auth_user_idでマップ化
    const talentMap = new Map<string, TalentRecord>();
    talents.forEach((t) => {
      talentMap.set(t.auth_user_id?.value || "", t);
    });

    // 3. 既存の推薦レコードを取得
    console.log(`🔍 既存の推薦レコードを確認`);
    const recCondition = talentAuthUserIds
      .map((id) => `人材ID = "${id}"`)
      .join(" or ");

    const existingRecsResponse = await recommendationClient.record.getAllRecords({
      app: appIds.recommendation,
      condition: `(${recCondition}) and 案件ID = "${jobId}"`,
    });

    const existingRecs = existingRecsResponse as RecommendationRecord[];
    
    // 人材ID→レコードIDのマップ
    const recMap = new Map<string, string>();
    existingRecs.forEach((rec) => {
      recMap.set(rec.人材ID.value, rec.$id.value);
    });

    // 4. 各人材に対してAI評価を実行
    console.log(`🤖 AI評価を実行: ${talentAuthUserIds.length}人`);
    const results: AIMatchResultResponse[] = [];

    for (const authUserId of talentAuthUserIds) {
      const talent = talentMap.get(authUserId);
      
      if (!talent) {
        console.warn(`⚠️ 人材が見つかりません: ${authUserId}`);
        continue;
      }

      console.log(`  → ${talent.氏名?.value || "(名前なし)"} のAI評価を実行中...`);

      // AI評価を実行
      const aiResult = await executeAIMatch({
        job: {
          title: jobRecord.案件名?.value || "",
          positions: jobRecord.職種_ポジション?.value || [],
          skills: jobRecord.スキル?.value || [],
          requiredSkills: jobRecord.必須スキル?.value || "",
          preferredSkills: jobRecord.尚可スキル?.value || "",
          description: jobRecord.概要?.value || "",
          environment: jobRecord.環境?.value || "",
          notes: jobRecord.備考?.value || "",
        },
        talent: {
          name: talent.氏名?.value || "",
          positions: talent.複数選択?.value || [],
          skills: talent.言語_ツール?.value || "",
          experience: talent.主な実績_PR_職務経歴?.value || "",
          desiredWork: talent.希望案件_作業内容?.value || "",
        },
      });

      // 5. 推薦DBに結果を保存
      const now = new Date().toISOString();
      const existingRecId = recMap.get(authUserId);

      const updateData = {
        AIマッチ実行状況: { value: "実行済み" },
        AI技術スキルスコア: { value: aiResult.skillScore.toString() },
        AI開発工程スコア: { value: aiResult.processScore.toString() },
        AIインフラスコア: { value: aiResult.infraScore.toString() },
        AI業務知識スコア: { value: aiResult.domainScore.toString() },
        AIチーム開発スコア: { value: aiResult.teamScore.toString() },
        AIツール環境スコア: { value: aiResult.toolScore.toString() },
        AI総合スコア: { value: aiResult.overallScore.toString() },
        AI評価結果: { value: aiResult.resultText },
        AI実行日時: { value: now },
      };

      let recommendationId: string;

      if (existingRecId) {
        // 既存レコードを更新
        await recommendationClient.record.updateRecord({
          app: appIds.recommendation,
          id: parseInt(existingRecId, 10),
          record: updateData,
        });
        recommendationId = existingRecId;
        console.log(`    ✅ 更新完了 (ID: ${existingRecId})`);
      } else {
        // 新規レコードを作成
        const createResult = await recommendationClient.record.addRecord({
          app: appIds.recommendation,
          record: {
            人材ID: { value: authUserId },
            案件ID: { value: jobId },
            適合スコア: { value: "0" },
            ...updateData,
          },
        });
        recommendationId = createResult.id;
        console.log(`    ✅ 作成完了 (ID: ${createResult.id})`);
      }

      results.push({
        talentAuthUserId: authUserId,
        talentName: talent.氏名?.value || "(名前なし)",
        result: aiResult,
        recommendationId,
      });
    }

    console.log(`🎉 AI評価完了: ${results.length}人`);

    return NextResponse.json({
      success: true,
      job: {
        id: jobRecord.$id.value,
        title: jobRecord.案件名?.value || "",
      },
      results,
      stats: {
        total: talentAuthUserIds.length,
        processed: results.length,
        errors: results.filter((r) => r.result.error).length,
      },
    });

  } catch (error) {
    console.error("AIマッチ実行エラー:", error);
    return NextResponse.json(
      { error: "AIマッチの実行に失敗しました" },
      { status: 500 }
    );
  }
};







