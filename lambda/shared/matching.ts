/**
 * Lambda用 マッチングスコア計算モジュール
 */

export type TalentForMatching = {
  id: string;
  authUserId: string;
  name: string;
  positions: string[];
  skills: string;
  experience: string;
  desiredRate?: string;
};

export type JobForMatching = {
  id: string;
  jobId: string;
  title: string;
  positions: string[];
  skills: string[];
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

/**
 * テキスト内でキーワードが出現する回数をカウント
 */
const countKeywordOccurrences = (text: string, keyword: string): number => {
  if (!text || !keyword) return 0;
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escapedKeyword, "gi");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
};

/**
 * 人材と案件のマッチングスコアを計算
 */
export const calculateMatchScore = (
  talent: TalentForMatching,
  job: JobForMatching
): MatchResult => {
  const matchDetails: MatchResult["matchDetails"] = [];
  let totalScore = 0;

  const keywords: string[] = [...(job.positions || []), ...(job.skills || [])];

  const talentTexts = {
    職種: (talent.positions || []).join(" "),
    言語_ツール: talent.skills || "",
    主な実績_PR_職務経歴: talent.experience || "",
  };

  for (const keyword of keywords) {
    let keywordTotal = 0;
    const sources: string[] = [];

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
