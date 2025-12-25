/**
 * おすすめ案件通知取得API
 * GET /api/notifications/recommended
 *
 * ログインユーザーに対するおすすめ案件通知を取得する
 * - 担当者おすすめ: 推薦DBの「担当者おすすめ」フラグが設定されているもの
 * - プログラムマッチ: 推薦DBに存在し、作成日時が7日以内のもの
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

// 7日以内かどうかを判定
const isWithinDays = (dateStr: string, days: number): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date >= threshold;
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

    const recommendations = recommendationsResponse.records as RecommendationRecord[];

    if (recommendations.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    // 2. 通知対象の推薦レコードをフィルタリング
    // - 担当者おすすめ: STAFF_RECOMMEND = "おすすめ"
    // - プログラムマッチ: 作成日時が7日以内
    const notificationTargets = recommendations.filter((rec) => {
      const isStaffRecommend = rec[RECOMMENDATION_FIELDS.STAFF_RECOMMEND]?.value === "おすすめ";
      const createdAt = rec.作成日時?.value;
      const isRecentlyCreated = createdAt && isWithinDays(createdAt, 7);

      return isStaffRecommend || isRecentlyCreated;
    });

    if (notificationTargets.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    // 3. 関連する案件情報を一括取得（N+1問題解消）
    const jobIds = [...new Set(
      notificationTargets
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
    // 担当者おすすめの場合は、AIマッチ通知と担当者おすすめ通知の2つを生成
    const notifications: RecommendedNotification[] = [];

    for (const rec of notificationTargets) {
      const jobId = rec[RECOMMENDATION_FIELDS.JOB_ID]?.value as string;
      const recId = rec.$id.value;
      const job = jobsMap.get(jobId);
      const recCreatedAt = rec.作成日時?.value;
      const recUpdatedAt = rec.更新日時?.value;

      const isStaffRecommend = rec[RECOMMENDATION_FIELDS.STAFF_RECOMMEND]?.value === "おすすめ";
      const isRecentlyCreated = recCreatedAt && isWithinDays(recCreatedAt, 7);

      // AIマッチ通知（作成日時が7日以内の場合）
      if (isRecentlyCreated) {
        notifications.push({
          id: `rec_${recId}_${jobId}_ai`,
          type: "recommended" as const,
          jobId: jobId || "",
          jobTitle: job?.title || "(案件名不明)",
          recommendationType: "program_match" as const,
          timestamp: recCreatedAt || new Date().toISOString(),
        });
      }

      // 担当者おすすめ通知（フラグが設定されている場合、AIマッチ通知とは別に生成）
      if (isStaffRecommend) {
        notifications.push({
          id: `rec_${recId}_${jobId}_staff`,
          type: "recommended" as const,
          jobId: jobId || "",
          jobTitle: job?.title || "(案件名不明)",
          recommendationType: "staff" as const,
          // 担当者おすすめは更新日時を優先（フラグ設定タイミングに近い）
          timestamp: recUpdatedAt || recCreatedAt || new Date().toISOString(),
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
