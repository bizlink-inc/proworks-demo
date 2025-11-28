/**
 * 推薦DBから候補者を取得するAPI
 * GET /api/admin/recommendations/[jobId]
 * 
 * 指定された案件の推薦データを取得し、
 * スコア降順で返す
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { createRecommendationClient, createTalentClient, getAppIds } from "@/lib/kintone/client";
import { RECOMMENDATION_FIELDS, TALENT_FIELDS } from "@/lib/kintone/fieldMapping";

type RecommendationRecord = {
  $id: { value: string };
  人材ID: { value: string };
  案件ID: { value: string };
  適合スコア: { value: string };
  // AI評価フィールド
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

type TalentRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  氏名: { value: string };
  複数選択: { value: string[] };
  言語_ツール: { value: string };
  主な実績_PR_職務経歴: { value: string };
  希望単価_月額: { value: string };
};

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) => {
  try {
    // 認証チェック
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "案件IDが指定されていません" },
        { status: 400 }
      );
    }

    const recommendationClient = createRecommendationClient();
    const talentClient = createTalentClient();
    const appIds = getAppIds();

    // 1. 推薦DBから該当案件の推薦データを取得（AI評価フィールドも含む）
    const recommendationsResponse = await recommendationClient.record.getAllRecords({
      app: appIds.recommendation,
      condition: `${RECOMMENDATION_FIELDS.JOB_ID} = "${jobId}"`,
      fields: [
        "$id",
        RECOMMENDATION_FIELDS.TALENT_ID,
        RECOMMENDATION_FIELDS.JOB_ID,
        RECOMMENDATION_FIELDS.SCORE,
        // AI評価フィールド
        RECOMMENDATION_FIELDS.AI_EXECUTION_STATUS,
        RECOMMENDATION_FIELDS.AI_SKILL_SCORE,
        RECOMMENDATION_FIELDS.AI_PROCESS_SCORE,
        RECOMMENDATION_FIELDS.AI_INFRA_SCORE,
        RECOMMENDATION_FIELDS.AI_DOMAIN_SCORE,
        RECOMMENDATION_FIELDS.AI_TEAM_SCORE,
        RECOMMENDATION_FIELDS.AI_TOOL_SCORE,
        RECOMMENDATION_FIELDS.AI_OVERALL_SCORE,
        RECOMMENDATION_FIELDS.AI_RESULT,
        RECOMMENDATION_FIELDS.AI_EXECUTED_AT,
      ],
      sortBy: [
        {
          field: RECOMMENDATION_FIELDS.SCORE,
          order: "desc",
        },
      ],
    });

    const recommendations = recommendationsResponse as RecommendationRecord[];

    if (recommendations.length === 0) {
      return NextResponse.json({
        talents: [],
        total: 0,
      });
    }

    // 2. 推薦データから人材IDを抽出
    const talentAuthUserIds = recommendations.map((r) => r.人材ID.value);

    // 3. 人材DBから対象の人材データを取得
    const talentCondition = talentAuthUserIds
      .map((id) => `${TALENT_FIELDS.AUTH_USER_ID} = "${id}"`)
      .join(" or ");

    const talentsResponse = await talentClient.record.getAllRecords({
      app: appIds.talent,
      condition: talentCondition,
      fields: [
        "$id",
        TALENT_FIELDS.AUTH_USER_ID,
        TALENT_FIELDS.FULL_NAME,
        "複数選択",
        TALENT_FIELDS.SKILLS,
        TALENT_FIELDS.EXPERIENCE,
        TALENT_FIELDS.DESIRED_RATE,
      ],
    });

    const talents = talentsResponse as TalentRecord[];

    // 4. 人材データをauth_user_idでマップ化
    const talentMap = new Map<string, TalentRecord>();
    talents.forEach((t) => {
      talentMap.set(t.auth_user_id?.value || "", t);
    });

    // 5. 推薦データと人材データを結合（AI評価データも含める）
    const matchedTalents = recommendations
      .map((rec) => {
        const talent = talentMap.get(rec.人材ID.value);
        if (!talent) return null;

        return {
          id: talent.$id.value,
          authUserId: talent.auth_user_id?.value || "",
          name: talent.氏名?.value || "(名前なし)",
          skills: talent.言語_ツール?.value || "",
          experience: talent.主な実績_PR_職務経歴?.value || "",
          desiredRate: talent.希望単価_月額?.value || "",
          positions: talent.複数選択?.value || [],
          score: parseInt(rec.適合スコア.value, 10) || 0,
          // AI評価データ
          aiExecutionStatus: rec.AIマッチ実行状況?.value || "",
          aiSkillScore: parseInt(rec.AI技術スキルスコア?.value || "0", 10) || 0,
          aiProcessScore: parseInt(rec.AI開発工程スコア?.value || "0", 10) || 0,
          aiInfraScore: parseInt(rec.AIインフラスコア?.value || "0", 10) || 0,
          aiDomainScore: parseInt(rec.AI業務知識スコア?.value || "0", 10) || 0,
          aiTeamScore: parseInt(rec.AIチーム開発スコア?.value || "0", 10) || 0,
          aiToolScore: parseInt(rec.AIツール環境スコア?.value || "0", 10) || 0,
          aiOverallScore: parseInt(rec.AI総合スコア?.value || "0", 10) || 0,
          aiResult: rec.AI評価結果?.value || "",
          aiExecutedAt: rec.AI実行日時?.value || "",
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);

    return NextResponse.json({
      talents: matchedTalents,
      total: matchedTalents.length,
    });

  } catch (error) {
    console.error("推薦データ取得エラー:", error);
    return NextResponse.json(
      { error: "推薦データの取得に失敗しました" },
      { status: 500 }
    );
  }
};

