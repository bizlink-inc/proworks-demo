import { createRecommendationClient, getAppIds } from "../client";
import { RECOMMENDATION_FIELDS } from "../fieldMapping";
import type { RecommendationRecord, Recommendation } from "../types";

/**
 * kintoneレコードをフロントエンド用の型に変換
 */
const convertRecommendationRecord = (record: RecommendationRecord): Recommendation => {
  return {
    id: record.$id.value,
    talentId: record.人材ID.value,
    jobId: record.案件ID.value,
    score: parseInt(record.適合スコア.value, 10) || 0,
  };
};

/**
 * 特定のユーザーの推薦データを取得
 * @param authUserId - ユーザーのauth_user_id
 * @returns 推薦データの配列
 */
export const getRecommendationsByAuthUserId = async (authUserId: string): Promise<Recommendation[]> => {
  const client = createRecommendationClient();
  const appId = getAppIds().recommendation;

  if (!appId) {
    console.warn("推薦DBのアプリIDが設定されていません");
    return [];
  }

  try {
    const response = await client.record.getRecords({
      app: appId,
      query: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${authUserId}"`,
    });

    return response.records.map((record) => convertRecommendationRecord(record as RecommendationRecord));
  } catch (error) {
    console.error("推薦データの取得に失敗:", error);
    return [];
  }
};

/**
 * 特定のユーザーの案件別おすすめスコアマップを取得
 * @param authUserId - ユーザーのauth_user_id
 * @returns { 案件ID: おすすめスコア } のマップ
 */
export const getRecommendationScoreMap = async (authUserId: string): Promise<Record<string, number>> => {
  const recommendations = await getRecommendationsByAuthUserId(authUserId);
  
  const scoreMap: Record<string, number> = {};
  
  for (const rec of recommendations) {
    // おすすめスコアの計算ロジック:
    // 1. 適合スコア（プログラムマッチ）をベースとする
    // 2. AIマッチスコアがあれば加算（将来拡張用）
    // 3. 担当者おすすめフラグがあれば最優先（将来拡張用）
    scoreMap[rec.jobId] = rec.score;
  }
  
  return scoreMap;
};

