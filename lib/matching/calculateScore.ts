/**
 * マッチングスコア計算モジュール
 * 
 * 案件と人材のマッチングスコアを計算する共通ロジック
 */

// ========================================
// 型定義
// ========================================

export type TalentForMatching = {
  id: string;
  authUserId: string;
  name: string;
  positions: string[];      // 職種（複数選択）
  skills: string;           // 言語_ツール（テキスト）
  experience: string;       // 主な実績_PR_職務経歴（テキスト）
  desiredRate?: string;
};

export type JobForMatching = {
  id: string;
  jobId: string;
  title: string;
  positions: string[];      // 職種_ポジション（複数選択）
  skills: string[];         // スキル（複数選択）
};

export type MatchResult = {
  talentId: string;
  talentAuthUserId: string;
  talentName: string;
  jobId: string;
  jobTitle: string;
  score: number;
  matchDetails: {
    keyword: string;
    count: number;
    source: string;
  }[];
};

// ========================================
// マッチングロジック
// ========================================

/**
 * テキスト内でキーワードが出現する回数をカウント
 * 大文字小文字を区別しない
 */
const countKeywordOccurrences = (text: string, keyword: string): number => {
  if (!text || !keyword) return 0;
  
  // 正規表現の特殊文字をエスケープ
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // 大文字小文字を区別しない検索
  const regex = new RegExp(escapedKeyword, 'gi');
  const matches = text.match(regex);
  
  return matches ? matches.length : 0;
};

/**
 * 人材と案件のマッチングスコアを計算
 * 
 * スコア計算ロジック:
 * 1. 案件の「職種_ポジション」と「スキル」から検索キーワードを抽出
 * 2. 人材の「職種」「言語_ツール」「主な実績_PR_職務経歴」でキーワードの出現回数をカウント
 * 3. 全キーワードの出現回数を合計してスコアとする
 */
export const calculateMatchScore = (talent: TalentForMatching, job: JobForMatching): MatchResult => {
  const matchDetails: MatchResult["matchDetails"] = [];
  let totalScore = 0;

  // 検索対象のキーワードを収集（職種_ポジション + スキル）
  const keywords: string[] = [
    ...(job.positions || []),
    ...(job.skills || []),
  ];

  // 人材の検索対象テキストを準備
  const talentTexts = {
    職種: (talent.positions || []).join(" "),
    言語_ツール: talent.skills || "",
    主な実績_PR_職務経歴: talent.experience || "",
  };

  // 各キーワードについてマッチングを実行
  for (const keyword of keywords) {
    let keywordTotal = 0;
    const sources: string[] = [];

    // 各テキストフィールドでキーワードをカウント
    for (const [fieldName, text] of Object.entries(talentTexts)) {
      const count = countKeywordOccurrences(text, keyword);
      if (count > 0) {
        keywordTotal += count;
        sources.push(`${fieldName}(${count})`);
      }
    }

    if (keywordTotal > 0) {
      matchDetails.push({
        keyword,
        count: keywordTotal,
        source: sources.join(", "),
      });
      totalScore += keywordTotal;
    }
  }

  return {
    talentId: talent.id,
    talentAuthUserId: talent.authUserId,
    talentName: talent.name,
    jobId: job.jobId,
    jobTitle: job.title,
    score: totalScore,
    matchDetails,
  };
};

/**
 * 複数の人材と1つの案件のマッチングスコアを計算し、上位N件を返す
 */
export const calculateTopMatches = (
  talents: TalentForMatching[],
  job: JobForMatching,
  topN: number = 10
): MatchResult[] => {
  const results: MatchResult[] = [];

  for (const talent of talents) {
    const result = calculateMatchScore(talent, job);
    // スコアが0より大きい場合のみ結果に含める
    if (result.score > 0) {
      results.push(result);
    }
  }

  // スコア降順でソートして上位N件を返す
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
};

