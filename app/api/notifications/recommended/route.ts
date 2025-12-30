/**
 * おすすめ案件通知取得API
 * GET /api/notifications/recommended
 *
 * ログインユーザーに対するおすすめ案件通知を取得する
 * - AIマッチ（プログラムマッチ）: 推薦DBに存在するもの
 * - 担当者おすすめ: 推薦DBの「担当者おすすめ」フラグが設定されているもの
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { createRecommendationClient, getAppIds } from "@/lib/kintone/client";
import { RECOMMENDATION_FIELDS } from "@/lib/kintone/fieldMapping";
import { getJobsByIds } from "@/lib/kintone/services/job";
import type { RecommendedNotification } from "@/lib/notification-context";

// 推薦レコード型
type RecommendationRecord = {
  $id: { value: string };
  作成日時?: { value: string };
  [key: string]: { value: string } | { value: string[] } | undefined;
};

export const GET = async () => {
  try {
    // 認証チェック
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const authUserId = session.user.id;
    const appIds = getAppIds();
    const recommendationClient = createRecommendationClient();

    // 1. ユーザーに対する推薦レコードを取得（limit 500で高速化）
    const condition = `${RECOMMENDATION_FIELDS.TALENT_ID} = "${authUserId}" limit 500`;

    const recommendationsResponse = await recommendationClient.record.getRecords({
      app: appIds.recommendation,
      query: condition,
      fields: [
        "$id",
        RECOMMENDATION_FIELDS.JOB_ID,
        RECOMMENDATION_FIELDS.STAFF_RECOMMEND,
        "作成日時",
        "更新日時",
      ],
    });

    const recommendations = recommendationsResponse.records as unknown as RecommendationRecord[];

    if (recommendations.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    // 2. 推薦レコードはすべて通知対象（AIマッチ通知として表示）
    // 担当者おすすめフラグがある場合は追加で担当者おすすめ通知も生成

    // 3. 関連する案件情報を一括取得（N+1問題解消）
    const jobIds = [...new Set(
      recommendations
        .map((rec) => rec[RECOMMENDATION_FIELDS.JOB_ID]?.value as string)
        .filter(Boolean)
    )];

    const jobsFromDb = await getJobsByIds(jobIds);
    const jobsMap = new Map<string, { title: string; createdAt: string }>();
    for (const [jobId, job] of jobsFromDb) {
      jobsMap.set(jobId, {
        title: job.title || "(案件名なし)",
        createdAt: job.createdAt || new Date().toISOString(),
      });
    }

    // 4. 通知データを生成
    // すべての推薦レコードに対してAIマッチ通知を生成
    // 担当者おすすめフラグがある場合は追加で担当者おすすめ通知も生成
    const notifications: RecommendedNotification[] = [];

    for (const rec of recommendations) {
      const jobId = rec[RECOMMENDATION_FIELDS.JOB_ID]?.value as string;
      const recId = rec.$id.value;
      const job = jobsMap.get(jobId);
      const recCreatedAt = rec.作成日時?.value;
      const recUpdatedAt = rec.更新日時?.value;

      const isStaffRecommend = rec[RECOMMENDATION_FIELDS.STAFF_RECOMMEND]?.value === "おすすめ";

      // AIマッチ通知（すべての推薦レコードに対して生成）
      notifications.push({
        id: `rec_${recId}_${jobId}_ai`,
        type: "recommended" as const,
        jobId: jobId || "",
        jobTitle: job?.title || "(案件名不明)",
        recommendationType: "program_match" as const,
        timestamp: recCreatedAt || new Date().toISOString(),
      });

      // 担当者おすすめ通知
      if (isStaffRecommend) {
        notifications.push({
          id: `rec_${recId}_${jobId}_staff`,
          type: "recommended" as const,
          jobId: jobId || "",
          jobTitle: job?.title || "(案件名不明)",
          recommendationType: "staff" as const,
          // 担当者おすすめは更新日時を優先（フラグ設定タイミングに近い）
          timestamp: (recUpdatedAt as string) || (recCreatedAt as string) || new Date().toISOString(),
        });
      }
    }

    // タイムスタンプの降順でソート
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error("おすすめ通知取得エラー:", error);
    return NextResponse.json(
      { error: "おすすめ通知の取得に失敗しました" },
      { status: 500 }
    );
  }
};
