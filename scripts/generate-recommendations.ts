/**
 * 推薦データのスコアを事前計算して出力するスクリプト
 * 使用方法: npx ts-node scripts/generate-recommendations.ts
 */

import { calculateTopMatches, TalentForMatching, JobForMatching } from "../lib/matching/calculateScore";
import { seedData3 } from "./seed-data-large";

// seedData1の定義（seed-data.tsからコピー）
const seedData1 = {
  authUsers: [
    { id: "seed_user_001", email: "seed_yamada@example.com" },
    { id: "seed_user_002", email: "seed_hanako@example.com" },
  ],
  talents: [
    {
      auth_user_id: "seed_user_001",
      氏名: "山田 太郎",
      言語_ツール: "JavaScript, TypeScript, React, Next.js, Node.js, Python, Django",
      主な実績_PR_職務経歴: `【経歴概要】
Web系エンジニアとして5年の実務経験があります。
フロントエンド・バックエンドの両方を経験し、特にReact/Next.jsを使ったモダンな開発が得意です。

【主なプロジェクト】
・ECサイトのリニューアル（Next.js + TypeScript）
・社内管理システムの新規開発（React + Django REST Framework）
・レガシーシステムのモダナイゼーション

【アピールポイント】
・要件定義から運用まで一貫して対応可能
・チーム開発の経験豊富
・新しい技術のキャッチアップが早い`,
      希望単価_月額: 70,
    },
    {
      auth_user_id: "seed_user_002",
      氏名: "田中 花子",
      言語_ツール: "JavaScript, TypeScript, React, Next.js, Node.js, Python, Django, AWS",
      主な実績_PR_職務経歴: `【経歴概要】
フルスタックエンジニアとして6年の実務経験があります。
フロントエンドからバックエンド、インフラまで幅広く対応可能です。
特にReact/Next.jsとAWSを使った開発が得意です。

【主なプロジェクト】
・スタートアップでの新規サービス立ち上げ（Next.js + Node.js + AWS）
・ECプラットフォームのフルスタック開発
・サーバーレスアーキテクチャへの移行プロジェクト

【アピールポイント】
・0→1のサービス立ち上げ経験豊富
・AWSを使ったインフラ構築・運用経験
・技術選定からデプロイまで一貫して対応可能`,
      希望単価_月額: 75,
    },
  ],
  jobs: [
    {
      案件名: "【掲載終了】レガシーシステム保守案件",
      職種_ポジション: ["インフラエンジニア"],
      スキル: ["Linux", "ShellScript", "AWS"],
    },
    {
      案件名: "大手ECサイトのフロントエンド刷新案件",
      職種_ポジション: ["フロントエンドエンジニア"],
      スキル: ["JavaScript", "React", "TypeScript"],
    },
    {
      案件名: "金融系WebアプリケーションAPI開発",
      職種_ポジション: ["バックエンドエンジニア"],
      スキル: ["Python", "Django", "PostgreSQL"],
    },
    {
      案件名: "スタートアップ向け新規サービス開発",
      職種_ポジション: ["フロントエンドエンジニア", "バックエンドエンジニア"],
      スキル: ["JavaScript", "Node.js", "React", "AWS"],
    },
    {
      案件名: "ヘルスケアアプリ開発案件",
      職種_ポジション: ["モバイル/アプリエンジニア"],
      スキル: ["React Native", "TypeScript", "Firebase"],
    },
    {
      案件名: "データ基盤構築・運用案件",
      職種_ポジション: ["データベースエンジニア", "インフラエンジニア"],
      スキル: ["Python", "BigQuery", "AWS"],
    },
  ],
};

// シードデータを統合
const seedData = {
  authUsers: [...seedData1.authUsers, ...seedData3.authUsers.filter(u =>
    !seedData1.authUsers.some(s => s.id === u.id || s.email === u.email)
  )],
  talents: [...seedData1.talents, ...seedData3.talents.filter(t =>
    !seedData1.talents.some(s => s.auth_user_id === t.auth_user_id)
  )],
  jobs: [...seedData1.jobs, ...seedData3.jobs],
};

// マッチング計算用の人材データを準備
const talentsForMatching: TalentForMatching[] = seedData.talents.map((talent, i) => ({
  id: `talent_${i}`,
  authUserId: talent.auth_user_id,
  name: talent.氏名,
  positions: [],
  skills: talent.言語_ツール,
  experience: talent.主な実績_PR_職務経歴,
  desiredRate: String(talent.希望単価_月額),
}));

// 推薦データを計算
const precomputedRecommendations: Array<{
  talentAuthUserId: string;
  jobIndex: number;
  score: number;
}> = [];

for (let jobIndex = 0; jobIndex < seedData.jobs.length; jobIndex++) {
  const job = seedData.jobs[jobIndex];

  const jobForMatching: JobForMatching = {
    id: `job_${jobIndex}`,
    jobId: `job_${jobIndex}`,
    title: job.案件名,
    positions: job.職種_ポジション || [],
    skills: job.スキル || [],
  };

  // 特定案件（大手ECサイトのフロントエンド刷新案件）は特殊処理
  const isTargetFrontendJob = job.案件名 === "大手ECサイトのフロントエンド刷新案件";

  if (isTargetFrontendJob) {
    const allMatches = calculateTopMatches(
      talentsForMatching,
      jobForMatching,
      talentsForMatching.length
    );

    const yamadaMatch = allMatches.find(m => m.talentAuthUserId === "seed_user_001");
    const hanakoMatch = allMatches.find(m => m.talentAuthUserId === "seed_user_002");
    const otherMatches = allMatches.filter(m =>
      m.talentAuthUserId !== "seed_user_001" && m.talentAuthUserId !== "seed_user_002"
    );

    const reorderedMatches: typeof allMatches = [];

    if (yamadaMatch) {
      reorderedMatches.push({
        ...yamadaMatch,
        score: Math.max(yamadaMatch.score, 100),
      });
    }

    if (hanakoMatch) {
      const yamadaScore = reorderedMatches[0]?.score ?? 100;
      reorderedMatches.push({
        ...hanakoMatch,
        score: Math.max(hanakoMatch.score, yamadaScore > 0 ? yamadaScore - 1 : 95),
      });
    }

    reorderedMatches.push(...otherMatches);

    const finalMatches = reorderedMatches.slice(0, 10);

    for (const match of finalMatches) {
      if (!match.talentAuthUserId) continue;
      // 山田太郎は除外
      if (match.talentAuthUserId === "seed_user_001") continue;

      precomputedRecommendations.push({
        talentAuthUserId: match.talentAuthUserId,
        jobIndex,
        score: match.score,
      });
    }
  } else {
    const topMatches = calculateTopMatches(talentsForMatching, jobForMatching, 10);

    for (const match of topMatches) {
      if (!match.talentAuthUserId) continue;
      // 山田太郎は除外
      if (match.talentAuthUserId === "seed_user_001") continue;

      precomputedRecommendations.push({
        talentAuthUserId: match.talentAuthUserId,
        jobIndex,
        score: match.score,
      });
    }
  }
}

// 結果を出力
console.log("// 事前計算済みの推薦データ");
console.log(`// 生成日時: ${new Date().toISOString()}`);
console.log(`// 総件数: ${precomputedRecommendations.length}件`);
console.log("");
console.log("const PRECOMPUTED_RECOMMENDATIONS: Array<{");
console.log("  talentAuthUserId: string;");
console.log("  jobIndex: number;");
console.log("  score: number;");
console.log("}> = [");

for (const rec of precomputedRecommendations) {
  console.log(`  { talentAuthUserId: "${rec.talentAuthUserId}", jobIndex: ${rec.jobIndex}, score: ${rec.score} },`);
}

console.log("];");
