import { NextRequest, NextResponse } from "next/server";
import { getAllJobs } from "@/lib/kintone/services/job";
import { getSession } from "@/lib/auth-server";
import { getAppliedJobIdsByAuthUserId } from "@/lib/kintone/services/application";
import { getRecommendationScoreMap } from "@/lib/kintone/services/recommendation";
import { POSITION_MAPPING } from "@/components/dashboard-filters";
import { createRecommendationClient, getAppIds } from "@/lib/kintone/client";
import { RECOMMENDATION_FIELDS } from "@/lib/kintone/fieldMapping";
import type { RecommendationRecord } from "@/lib/kintone/types";

export const GET = async (request: NextRequest) => {
  try {
    // クエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const sort = searchParams.get("sort") || "recommend"; // デフォルトをおすすめ順に変更
    const remoteParam = searchParams.get("remote") || "";
    const positionsParam = searchParams.get("positions") || "";
    const location = searchParams.get("location") || "";
    const nearestStation = searchParams.get("nearestStation") || "";
    // ページネーションパラメータ
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "0", 10); // 0 = 全件

    // フィルターをパース（カンマ区切り）
    const remoteFilters = remoteParam ? remoteParam.split(",") : [];
    const positionFilters = positionsParam ? positionsParam.split(",") : [];

    // kintoneからすべての案件を取得
    let jobs = await getAllJobs();

    // 募集ステータスが「クローズ」の案件を除外（案件一覧には表示しない）
    jobs = jobs.filter((job) => job.recruitmentStatus !== 'クローズ');

    // ログインしている場合、応募ステータスと推薦情報を取得
    let appliedJobIdsSet: Set<string> = new Set();
    let recommendationMap: Record<string, {
      score: number;
      staffRecommend: boolean;
      aiMatched: boolean;
    }> = {};
    let currentUserId: string | undefined;

    try {
      const session = await getSession();
      console.log(`[Jobs API] セッション: ${session ? `user.id=${session.user?.id}` : 'なし'}`);
      if (session?.user?.id) {
        currentUserId = session.user.id;

        // 応募済み案件IDを取得（3ヶ月制限なし、checkDuplicateApplicationと同じ条件）
        console.log(`[Jobs API] getAppliedJobIdsByAuthUserId 呼び出し開始`);
        const appliedJobIds = await getAppliedJobIdsByAuthUserId(session.user.id);
        console.log(`[Jobs API] 応募済みID取得完了: ${appliedJobIds.length}件, IDs=${JSON.stringify(appliedJobIds)}`);
        appliedJobIdsSet = new Set(appliedJobIds);

        // 推薦情報を取得（スコア、担当者おすすめ、AIマッチ）
        const recommendationClient = createRecommendationClient();
        const appIds = getAppIds();

        if (appIds.recommendation) {
          // getRecordsで最大500件取得（getAllRecordsの100件ページングを回避）
          const recommendationsResponse = await recommendationClient.record.getRecords({
            app: appIds.recommendation,
            query: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${session.user.id}" limit 500`,
            fields: [
              RECOMMENDATION_FIELDS.JOB_ID,
              RECOMMENDATION_FIELDS.SCORE,
              RECOMMENDATION_FIELDS.STAFF_RECOMMEND,
            ],
          });
          const recommendations = recommendationsResponse.records as unknown as RecommendationRecord[];

          console.log(`[Jobs API] 推薦レコード取得: ${recommendations.length}件 (user: ${session.user.id})`);

          for (const rec of recommendations) {
            const jobId = rec[RECOMMENDATION_FIELDS.JOB_ID].value;
            const score = parseInt(rec[RECOMMENDATION_FIELDS.SCORE].value, 10) || 0;
            const staffRecommendValue = rec[RECOMMENDATION_FIELDS.STAFF_RECOMMEND]?.value;
            const staffRecommend = staffRecommendValue === "おすすめ";
            // 推薦DBにレコードが存在すればAI Matchとする
            const aiMatched = true;

            // 担当者おすすめの場合はログ出力
            if (staffRecommend) {
              console.log(`[Jobs API] 担当者おすすめ発見: jobId=${jobId}, staffRecommendValue="${staffRecommendValue}"`);
            }

            recommendationMap[jobId] = {
              score,
              staffRecommend,
              aiMatched,
            };
          }
        }
      }
    } catch (error) {
      // ログインしていない場合はスキップ
      console.log("User not logged in or error fetching applications");
    }

    // 応募済み案件を完全に除外（3ヶ月制限なし）
    jobs = jobs.filter((job) => !appliedJobIdsSet.has(job.id));

    // 全案件数（フィルター適用前）を保持
    const totalAll = jobs.length;

    // キーワード検索（案件名、作業内容、環境、必須スキル、尚可スキルを対象）
    // 複数単語のAND検索に対応（スペースで区切られた単語は全て含まれる必要がある）
    if (query) {
      // クエリをスペースで分割し、空文字列を除外
      const searchWords = query
        .split(/\s+/)
        .map(word => word.trim())
        .filter(word => word.length > 0)
        .map(word => word.toLowerCase());

      if (searchWords.length > 0) {
        jobs = jobs.filter((job) => {
          // 各単語が検索対象フィールドのいずれかに含まれているかチェック
          const checkWordMatches = (word: string): boolean => {
            return (
              job.title?.toLowerCase().includes(word) ||
              job.description?.toLowerCase().includes(word) ||
              job.environment?.toLowerCase().includes(word) ||
              job.requiredSkills?.toLowerCase().includes(word) ||
              job.preferredSkills?.toLowerCase().includes(word) ||
              job.features?.some(f => f.toLowerCase().includes(word)) ||
              job.position?.some(p => p.toLowerCase().includes(word))
            );
          };

          // 全ての単語が含まれている場合のみ該当（AND検索）
          return searchWords.every(word => checkWordMatches(word));
        });
      }
    }

    // リモート可否フィルター（案件特徴から検索）
    // 選択肢: フルリモート可, リモート併用可, 常駐案件
    if (remoteFilters.length > 0) {
      jobs = jobs.filter((job) => {
        // 案件特徴（features配列）にフィルター条件のいずれかが含まれるか
        return job.features?.some(feature => remoteFilters.includes(feature));
      });
    }

    // 職種/ポジションフィルター
    // マッピングに基づいて職種_ポジションを検索
    if (positionFilters.length > 0) {
      jobs = jobs.filter((job) => {
        // 選択された各職種カテゴリに対してチェック
        return positionFilters.some(category => {
          const mappedValues = POSITION_MAPPING[category];
          
          if (!mappedValues || mappedValues.length === 0) {
            return false;
          }
          
          // マッピングされた値のいずれかが職種_ポジションに含まれるか
          return job.position?.some(p => 
            mappedValues.some(mapped => p.includes(mapped))
          );
        });
      });
    }

    // 勤務地エリアフィルター（部分一致検索）
    if (location) {
      const locationQuery = location.toLowerCase();
      jobs = jobs.filter((job) => {
        return job.location?.toLowerCase().includes(locationQuery);
      });
    }

    // 最寄駅フィルター（"駅"を除いた部分一致検索）
    if (nearestStation) {
      // 入力から"駅"を除去
      const stationQuery = nearestStation.replace(/駅$/g, "").toLowerCase();
      jobs = jobs.filter((job) => {
        if (!job.nearestStation) return false;
        // 案件の最寄駅からも"駅"を除去して部分一致検索
        const jobStation = job.nearestStation.replace(/駅$/g, "").toLowerCase();
        return jobStation.includes(stationQuery);
      });
    }

    // 推薦DBにあるが案件一覧に表示されない案件をログ出力
    const recommendedJobIds = Object.keys(recommendationMap);
    const displayedJobIds = new Set(jobs.map(job => job.id));
    const missingJobIds = recommendedJobIds.filter(jobId => !displayedJobIds.has(jobId));
    if (missingJobIds.length > 0) {
      console.log(`[Jobs API] 推薦DBにあるが案件一覧に表示されない案件: ${missingJobIds.length}件`);
      for (const jobId of missingJobIds) {
        const isApplied = appliedJobIdsSet.has(jobId);
        console.log(`  - jobId=${jobId}, 応募済み=${isApplied ? 'はい' : 'いいえ'}`);
      }
    }

    // 案件に推薦情報を追加（応募済み案件は除外済みのためapplicationStatusは常にnull）
    const jobsWithMetadata = jobs.map(job => {
      const recommendation = recommendationMap[job.id];
      return {
        ...job,
        recommendationScore: recommendation?.score || 0,
        staffRecommend: recommendation?.staffRecommend || false,
        aiMatched: recommendation?.aiMatched || false,
        applicationStatus: null
      };
    });

    // ソート処理
    let sortedJobs = jobsWithMetadata;
    
    if (sort === "recommend") {
      // おすすめ順
      // ③担当者おすすめ（最優先）
      // ②AIマッチ
      // ①登録情報マッチ（適合スコア）
      sortedJobs = sortedJobs.sort((a, b) => {
        // 優先順位1: 担当者おすすめ
        if (a.staffRecommend && !b.staffRecommend) return -1;
        if (!a.staffRecommend && b.staffRecommend) return 1;

        // 優先順位2: AIマッチ
        if (a.aiMatched && !b.aiMatched) return -1;
        if (!a.aiMatched && b.aiMatched) return 1;

        // 優先順位3: 推薦スコアの降順でソート
        const scoreA = a.recommendationScore || 0;
        const scoreB = b.recommendationScore || 0;
        
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        
        // スコアが同じ場合は新着順（作成日時の降順）
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } else if (sort === "new") {
      // 新着順（作成日時の降順）
      sortedJobs = sortedJobs.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } else if (sort === "price") {
      // 単価が高い順（数値として比較）
      sortedJobs = sortedJobs.sort((a, b) => {
        const rateA = typeof a.rate === 'string' ? parseInt(a.rate, 10) : (a.rate || 0);
        const rateB = typeof b.rate === 'string' ? parseInt(b.rate, 10) : (b.rate || 0);
        return rateB - rateA;
      });
    }

    // ページネーション適用
    const total = sortedJobs.length;
    const paginatedJobs = limit > 0
      ? sortedJobs.slice(skip, skip + limit)
      : sortedJobs;

    return NextResponse.json({
      items: paginatedJobs,
      total,
      totalAll,
    });
  } catch (error) {
    console.error("案件一覧の取得に失敗:", error);
    return NextResponse.json(
      { error: "案件一覧の取得に失敗しました" },
      { status: 500 }
    );
}
};
