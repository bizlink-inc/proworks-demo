/**
 * 管理者用 案件に対するマッチング人材取得API
 * GET /api/admin/recommendations/[jobId]
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
};

type TalentRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  氏名: { value: string };
  言語_ツール: { value: string };
  主な実績_PR_職務経歴: { value: string };
  希望単価_月額: { value: string };
  複数選択: { value: string[] }; // 職種
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
        { error: "案件IDが必要です" },
        { status: 400 }
      );
    }

    const recommendationClient = createRecommendationClient();
    const talentClient = createTalentClient();
    const appIds = getAppIds();

    // 指定された案件IDに対する推薦データを取得
    const recommendationResponse = await recommendationClient.record.getAllRecords({
      app: appIds.recommendation,
      condition: `${RECOMMENDATION_FIELDS.JOB_ID} = "${jobId}"`,
      fields: [
        "$id",
        RECOMMENDATION_FIELDS.TALENT_ID,
        RECOMMENDATION_FIELDS.JOB_ID,
        RECOMMENDATION_FIELDS.SCORE,
      ],
    });

    const recommendations = recommendationResponse as RecommendationRecord[];

    if (recommendations.length === 0) {
      return NextResponse.json({ talents: [], total: 0 });
    }

    // 推薦データに含まれる人材IDを抽出（auth_user_id）
    const talentAuthUserIds = recommendations.map((r) => r.人材ID.value);

    // 人材データを取得
    const talentResponse = await talentClient.record.getAllRecords({
      app: appIds.talent,
      condition: talentAuthUserIds.map((id) => `${TALENT_FIELDS.AUTH_USER_ID} = "${id}"`).join(" or "),
      fields: [
        "$id",
        TALENT_FIELDS.AUTH_USER_ID,
        TALENT_FIELDS.FULL_NAME,
        TALENT_FIELDS.SKILLS,
        TALENT_FIELDS.EXPERIENCE,
        TALENT_FIELDS.DESIRED_RATE,
        "複数選択", // 職種フィールド
      ],
    });

    const talents = talentResponse as TalentRecord[];

    // 人材データをauth_user_idでマップ化
    const talentMap = new Map<string, TalentRecord>();
    talents.forEach((t) => {
      talentMap.set(t.auth_user_id.value, t);
    });

    // 推薦データと人材データを結合し、スコア降順でソート
    const matchedTalents = recommendations
      .map((rec) => {
        const talent = talentMap.get(rec.人材ID.value);
        if (!talent) return null;

        return {
          id: talent.$id.value,
          authUserId: talent.auth_user_id.value,
          name: talent.氏名?.value || "(名前なし)",
          skills: talent.言語_ツール?.value || "",
          experience: talent.主な実績_PR_職務経歴?.value || "",
          desiredRate: talent.希望単価_月額?.value || "",
          positions: talent.複数選択?.value || [],
          score: parseInt(rec.適合スコア.value, 10) || 0,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null)
      .sort((a, b) => b.score - a.score);

    return NextResponse.json({
      talents: matchedTalents,
      total: matchedTalents.length,
    });
  } catch (error) {
    console.error("マッチング人材取得エラー:", error);
    return NextResponse.json(
      { error: "マッチング人材の取得に失敗しました" },
      { status: 500 }
    );
  }
};

