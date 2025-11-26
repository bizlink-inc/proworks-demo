/**
 * 候補者抽出API
 * POST /api/admin/extract/[jobId]
 * 
 * 指定された案件に対してマッチングスコアを計算し、
 * 上位10人の候補者を返す。同時に推薦DBにも登録する。
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { createTalentClient, createJobClient, createRecommendationClient, getAppIds } from "@/lib/kintone/client";
import { RECOMMENDATION_FIELDS } from "@/lib/kintone/fieldMapping";
import { calculateTopMatches, TalentForMatching, JobForMatching } from "@/lib/matching/calculateScore";

// Kintoneレコード型
type TalentRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  氏名: { value: string };
  複数選択: { value: string[] };
  言語_ツール: { value: string };
  主な実績_PR_職務経歴: { value: string };
  希望単価_月額: { value: string };
};

type JobRecord = {
  $id: { value: string };
  案件名: { value: string };
  職種_ポジション: { value: string[] };
  スキル: { value: string[] };
};

type RecommendationRecord = {
  $id: { value: string };
  人材ID: { value: string };
  案件ID: { value: string };
  適合スコア: { value: string };
};

export const POST = async (
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

    const appIds = getAppIds();
    const talentClient = createTalentClient();
    const jobClient = createJobClient();
    const recommendationClient = createRecommendationClient();

    // 1. 対象の案件を取得（jobIdはレコード番号）
    let jobRecord: JobRecord | null = null;
    
    try {
      const jobResponse = await jobClient.record.getRecord({
        app: appIds.job,
        id: parseInt(jobId, 10),
        fields: ["$id", "案件名", "職種_ポジション", "スキル"],
      });
      jobRecord = jobResponse.record as JobRecord;
    } catch (error) {
      console.error("案件取得エラー:", error);
      return NextResponse.json(
        { error: "指定された案件が見つかりません" },
        { status: 404 }
      );
    }

    // 案件DBでは$id（レコード番号）を案件IDとして使用
    const job: JobForMatching = {
      id: jobRecord.$id.value,
      jobId: jobRecord.$id.value, // レコード番号を案件IDとして使用
      title: jobRecord.案件名?.value || "(案件名なし)",
      positions: jobRecord.職種_ポジション?.value || [],
      skills: jobRecord.スキル?.value || [],
    };

    // 2. 全人材を取得
    const talentsResponse = await talentClient.record.getAllRecords({
      app: appIds.talent,
      fields: ["$id", "auth_user_id", "氏名", "複数選択", "言語_ツール", "主な実績_PR_職務経歴", "希望単価_月額"],
    });

    const talents: TalentForMatching[] = (talentsResponse as TalentRecord[]).map((record) => ({
      id: record.$id.value,
      authUserId: record.auth_user_id?.value || "",
      name: record.氏名?.value || "(名前なし)",
      positions: record.複数選択?.value || [],
      skills: record.言語_ツール?.value || "",
      experience: record.主な実績_PR_職務経歴?.value || "",
      desiredRate: record.希望単価_月額?.value || "",
    }));

    // 3. マッチングスコアを計算（上位10人）
    const topMatches = calculateTopMatches(talents, job, 10);

    // 4. 既存の推薦レコードを取得
    const existingRecsResponse = await recommendationClient.record.getAllRecords({
      app: appIds.recommendation,
      condition: `案件ID = "${job.jobId}"`,
      fields: ["$id", "人材ID", "案件ID", "適合スコア"],
    });
    const existingRecs = existingRecsResponse as RecommendationRecord[];

    // 既存データをMapに変換
    const existingRecsMap = new Map<string, string>();
    for (const rec of existingRecs) {
      existingRecsMap.set(rec.人材ID.value, rec.$id.value);
    }

    // 5. 推薦DBに登録/更新
    const recordsToCreate: any[] = [];
    const recordsToUpdate: { id: string; record: any }[] = [];

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
    }

    // 一括更新
    if (recordsToUpdate.length > 0) {
      await recommendationClient.record.updateRecords({
        app: appIds.recommendation,
        records: recordsToUpdate,
      });
    }

    // 6. レスポンス用のデータを整形
    const talentMap = new Map(talents.map((t) => [t.authUserId, t]));
    
    const responseTalents = topMatches.map((match) => {
      const talent = talentMap.get(match.talentAuthUserId);
      return {
        id: match.talentId,
        authUserId: match.talentAuthUserId,
        name: match.talentName,
        skills: talent?.skills || "",
        experience: talent?.experience || "",
        desiredRate: talent?.desiredRate || "",
        positions: talent?.positions || [],
        score: match.score,
      };
    });

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        jobId: job.jobId,
        title: job.title,
      },
      talents: responseTalents,
      stats: {
        totalTalents: talents.length,
        matchedTalents: topMatches.length,
        created: recordsToCreate.length,
        updated: recordsToUpdate.length,
      },
    });

  } catch (error) {
    console.error("候補者抽出エラー:", error);
    return NextResponse.json(
      { error: "候補者の抽出に失敗しました" },
      { status: 500 }
    );
  }
};

