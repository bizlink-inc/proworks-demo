"use client";

/**
 * 管理者ダッシュボード - 案件マッチング画面
 * /admin/dashboard
 * 
 * 左側: 案件一覧
 * 右側: 選択した案件に対して「候補者抽出」ボタンで人材を抽出
 *       上位10人を表示し、人材を選択して「AIマッチ実行」
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { toast, Toaster } from "sonner";

// kintone設定
const KINTONE_BASE_URL = "https://jecen6wnsv66.cybozu.com";
const KINTONE_TALENT_APP_ID = "81";
const KINTONE_JOB_APP_ID = "85";
const KINTONE_RECOMMENDATION_APP_ID = "97";

// 型定義
type Job = {
  id: string;
  jobId: string;
  title: string;
  positions: string[];
  skills: string[];
  features: string[];
  location: string;
  rate: string;
  description: string;
  listingStatus: string;  // "有" or "無"（AIマッチング対象可否）
};

type Talent = {
  id: string;
  authUserId: string;
  name: string;
  skills: string;
  experience: string;
  desiredRate: string;
  positions: string[];
  score: number;
  // AI評価結果
  aiExecutionStatus?: string;
  aiSkillScore?: number;
  aiProcessScore?: number;
  aiInfraScore?: number;
  aiDomainScore?: number;
  aiTeamScore?: number;
  aiToolScore?: number;
  aiOverallScore?: number;
  aiResult?: string;
  aiExecutedAt?: string;
  // 担当者おすすめ
  staffRecommend?: boolean;
};

// AI評価結果型
type AIMatchResult = {
  talentAuthUserId: string;
  talentName: string;
  result: {
    skillScore: number;
    processScore: number;
    infraScore: number;
    domainScore: number;
    teamScore: number;
    toolScore: number;
    overallScore: number;
    resultText: string;
    error?: string;
  };
  recommendationId: string;
};

// ソートオプション
type SortOption = "score" | "aiOverall" | "aiSkill" | "aiProcess" | "aiInfra" | "aiDomain" | "aiTeam" | "aiTool" | "staffRecommend";

// ========================================
// レーダーチャートコンポーネント
// ========================================
const RadarChart = ({ 
  scores, 
  size = 120,
  showLabels = false 
}: { 
  scores: { skill: number; process: number; infra: number; domain: number; team: number; tool: number };
  size?: number;
  showLabels?: boolean;
}) => {
  const center = size / 2;
  const radius = size * 0.4;
  const labels = ["技術", "工程", "インフラ", "業務", "チーム", "ツール"];
  const values = [scores.skill, scores.process, scores.infra, scores.domain, scores.team, scores.tool];
  
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const outerPoints = Array.from({ length: 6 }, (_, i) => getPoint(i, 100));
  const outerPath = outerPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  
  const midPoints = Array.from({ length: 6 }, (_, i) => getPoint(i, 50));
  const midPath = midPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  
  const dataPoints = values.map((v, i) => getPoint(i, v));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} className="drop-shadow-sm">
      <path d={outerPath} fill="#e8f0fd" stroke="#d5e5f0" strokeWidth="1" />
      <path d={midPath} fill="none" stroke="#d5e5f0" strokeWidth="1" strokeDasharray="2,2" />
      
      {outerPoints.map((p, i) => (
        <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#d5e5f0" strokeWidth="1" />
      ))}
      
      <path 
        d={dataPath} 
        fill="rgba(99, 178, 205, 0.3)" 
        stroke="#63b2cd" 
        strokeWidth="2"
      />
      
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#63b2cd" />
      ))}
      
      {showLabels && outerPoints.map((p, i) => {
        const labelOffset = 12;
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
        const lx = center + (radius + labelOffset) * Math.cos(angle);
        const ly = center + (radius + labelOffset) * Math.sin(angle);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[8px] fill-[var(--pw-text-gray)]"
          >
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
};

// ========================================
// スコアバーコンポーネント（AIスコア用：高いほど暖色）
// ========================================
const ScoreBar = ({ score, label, compact = false }: { score: number; label: string; compact?: boolean }) => {
  // 高スコア = 暖色（赤/オレンジ）、低スコア = 寒色（青/グレー）
  const getColor = (s: number) => {
    if (s >= 80) return "bg-[#e53935]";      // 赤（最高）
    if (s >= 60) return "bg-[#fb8c00]";      // オレンジ
    if (s >= 40) return "bg-[#63b2cd]";      // 水色
    return "bg-[#90a4ae]";                   // グレー（低）
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-[var(--pw-text-gray)] w-8">{label}</span>
        <div className="flex-1 h-1.5 bg-[var(--pw-border-lighter)] rounded-full overflow-hidden">
          <div 
            className={`h-full ${getColor(score)} transition-all duration-500`} 
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-[var(--pw-text-primary)] w-6 text-right">{score}</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--pw-text-gray)]">{label}</span>
        <span className="font-semibold text-[var(--pw-text-primary)]">{score}点</span>
      </div>
      <div className="h-2 bg-[var(--pw-border-lighter)] rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(score)} transition-all duration-500`} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

// ========================================
// メインコンポーネント
// ========================================
const AdminDashboardPage = () => {
  const router = useRouter();
  
  // 状態管理
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [selectedTalentIds, setSelectedTalentIds] = useState<Set<string>>(new Set());
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingTalents, setIsLoadingTalents] = useState(false);
  const [error, setError] = useState("");
  
  // AI評価関連
  const [isAIMatching, setIsAIMatching] = useState(false);
  const [aiMatchResults, setAiMatchResults] = useState<AIMatchResult[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedResultTalent, setSelectedResultTalent] = useState<Talent | null>(null);
  
  // UI状態
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [expandedTalentId, setExpandedTalentId] = useState<string | null>(null);
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [showActiveJobs, setShowActiveJobs] = useState(true);    // 実案件（掲載用ステータス「有」）を表示
  const [showInactiveJobs, setShowInactiveJobs] = useState(true); // 非実案件（掲載用ステータス「無」）を表示
  
  // 担当者おすすめ関連（個別の人材IDごとに処理中状態を管理）
  const [settingRecommendIds, setSettingRecommendIds] = useState<Set<string>>(new Set());

  // バッチ設定関連
  const [scoreThreshold, setScoreThreshold] = useState<number>(3);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showBatchSettings, setShowBatchSettings] = useState(false);

  // バッチ設定を取得
  useEffect(() => {
    const fetchBatchSettings = async () => {
      try {
        const response = await fetch("/api/admin/batch-settings");
        if (response.ok) {
          const data = await response.json();
          setScoreThreshold(data.scoreThreshold ?? 3);
        }
      } catch (error) {
        console.error("バッチ設定取得エラー:", error);
      }
    };
    fetchBatchSettings();
  }, []);

  // バッチ設定を保存
  const handleSaveBatchSettings = async () => {
    try {
      setIsSavingSettings(true);
      const response = await fetch("/api/admin/batch-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreThreshold }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "設定の保存に失敗しました");
        return;
      }

      toast.success("設定を保存しました", { duration: 3000 });
      setShowBatchSettings(false);
    } catch (error) {
      console.error("設定保存エラー:", error);
      toast.error("設定の保存に失敗しました");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // 認証チェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/session");
        const data = await response.json();
        if (!data.authenticated) {
          router.push("/admin/login");
        }
      } catch {
        router.push("/admin/login");
      }
    };
    checkAuth();
  }, [router]);

  // 案件一覧を取得
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoadingJobs(true);
        const response = await fetch("/api/admin/jobs");
        
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }

        const data = await response.json();
        
        if (!response.ok) {
          setError(data.error || "案件の取得に失敗しました");
          return;
        }

        setJobs(data.jobs);
      } catch {
        setError("通信エラーが発生しました");
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [router]);

  // フィルタリングされた案件
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // 実案件/非実案件フィルター
      const isActive = job.listingStatus !== "無";
      if (isActive && !showActiveJobs) return false;
      if (!isActive && !showInactiveJobs) return false;

      // フリーワード検索
      if (jobSearchQuery) {
        const query = jobSearchQuery.toLowerCase();
        const matchesSearch =
          job.title.toLowerCase().includes(query) ||
          job.positions.some(p => p.toLowerCase().includes(query)) ||
          job.skills.some(s => s.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [jobs, jobSearchQuery, showActiveJobs, showInactiveJobs]);

  // ソートされた人材リスト
  const sortedTalents = useMemo(() => {
    return [...talents].sort((a, b) => {
      switch (sortBy) {
        case "staffRecommend":
          // 担当者おすすめを優先（おすすめが上に来る）
          if (a.staffRecommend && !b.staffRecommend) return -1;
          if (!a.staffRecommend && b.staffRecommend) return 1;
          return b.score - a.score;
        case "aiOverall":
          return (b.aiOverallScore || 0) - (a.aiOverallScore || 0);
        case "aiSkill":
          return (b.aiSkillScore || 0) - (a.aiSkillScore || 0);
        case "aiProcess":
          return (b.aiProcessScore || 0) - (a.aiProcessScore || 0);
        case "aiInfra":
          return (b.aiInfraScore || 0) - (a.aiInfraScore || 0);
        case "aiDomain":
          return (b.aiDomainScore || 0) - (a.aiDomainScore || 0);
        case "aiTeam":
          return (b.aiTeamScore || 0) - (a.aiTeamScore || 0);
        case "aiTool":
          return (b.aiToolScore || 0) - (a.aiToolScore || 0);
        default:
          return b.score - a.score;
      }
    });
  }, [talents, sortBy]);

  // AI評価済みの人材数
  const aiEvaluatedCount = useMemo(() => {
    return talents.filter(t => t.aiExecutionStatus === "実行済み").length;
  }, [talents]);

  // 担当者おすすめの人材数
  const staffRecommendCount = useMemo(() => {
    return talents.filter(t => t.staffRecommend).length;
  }, [talents]);

  // 推薦データを再取得する関数
  const refreshRecommendations = async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/recommendations/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.talents && data.talents.length > 0) {
          setTalents(data.talents);
        }
      }
    } catch (error) {
      console.error("データ再取得エラー:", error);
    }
  };

  // 案件選択時の処理
  const handleSelectJob = async (job: Job) => {
    setSelectedJob(job);
    setSelectedTalentIds(new Set());
    setError("");
    setExpandedTalentId(null);
    
    try {
      setIsLoadingTalents(true);
      const response = await fetch(`/api/admin/recommendations/${job.jobId}`);
      
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();
      
      if (response.ok && data.talents && data.talents.length > 0) {
        setTalents(data.talents);
      } else {
        setTalents([]);
      }
    } catch {
      setError("データの取得に失敗しました");
    } finally {
      setIsLoadingTalents(false);
    }
  };

  // 人材選択のトグル
  const handleToggleTalent = (talentId: string) => {
    setSelectedTalentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(talentId)) {
        newSet.delete(talentId);
      } else {
        newSet.add(talentId);
      }
      return newSet;
    });
  };

  // 全選択/全解除
  const handleToggleAll = () => {
    if (selectedTalentIds.size === talents.length) {
      setSelectedTalentIds(new Set());
    } else {
      setSelectedTalentIds(new Set(talents.map(t => t.authUserId)));
    }
  };

  // AIマッチ実行
  const handleAIMatch = async () => {
    if (!selectedJob || selectedTalentIds.size === 0) return;

    try {
      setIsAIMatching(true);
      setError("");
      setAiMatchResults([]);

      const response = await fetch("/api/admin/ai-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: selectedJob.jobId,
          talentAuthUserIds: Array.from(selectedTalentIds),
        }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "AIマッチの実行に失敗しました");
        return;
      }

      setAiMatchResults(data.results);

      // データを再取得して最新状態に更新
      await refreshRecommendations(selectedJob.jobId);

      // 選択をクリア
      setSelectedTalentIds(new Set());

      // エラーが発生した場合は警告を表示
      if (data.stats.errors > 0) {
        setError(`⚠️ ${data.stats.errors}件のAI評価に失敗しました。詳細は結果画面をご確認ください。`);
      }

      // 結果モーダルを表示
      setShowResultModal(true);
    } catch (error) {
      console.error("AIマッチ実行エラー:", error);
      setError("通信エラーが発生しました");
    } finally {
      setIsAIMatching(false);
    }
  };

  // AI評価詳細を表示
  const handleShowAIResult = (talent: Talent) => {
    setSelectedResultTalent(talent);
    setShowResultModal(true);
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch {
      console.error("ログアウトエラー");
    }
  };

  // 担当者おすすめをトグル（個別）
  const handleToggleRecommend = async (talent: Talent) => {
    if (!selectedJob || settingRecommendIds.has(talent.authUserId)) return;

    const isAdding = !talent.staffRecommend;
    
    try {
      // この人材を処理中に設定
      setSettingRecommendIds(prev => new Set(prev).add(talent.authUserId));

      const response = await fetch("/api/admin/staff-recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: selectedJob.jobId,
          talentAuthUserIds: [talent.authUserId],
          recommend: isAdding,
        }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "担当者おすすめの設定に失敗しました");
        return;
      }

      // データを再取得して最新状態に更新
      await refreshRecommendations(selectedJob.jobId);

      // トースト通知
      if (isAdding) {
        toast.success(
          `「${selectedJob.title}」に対して「${talent.name}」さんを担当者おすすめとして登録しました`,
          { duration: 4000 }
        );
      } else {
        toast.info(
          `「${talent.name}」さんの担当者おすすめを解除しました`,
          { duration: 3000 }
        );
      }

    } catch (error) {
      console.error("担当者おすすめ設定エラー:", error);
      toast.error("通信エラーが発生しました");
    } finally {
      // 処理完了後、この人材を処理中から削除
      setSettingRecommendIds(prev => {
        const next = new Set(prev);
        next.delete(talent.authUserId);
        return next;
      });
    }
  };


  // マッチスコアに応じた色（高いほど暖色）
  // スコアは0〜20程度の範囲を想定
  const getMatchScoreColor = (score: number) => {
    if (score >= 10) return "bg-[#e53935]";    // 赤（最高）
    if (score >= 7) return "bg-[#fb8c00]";     // オレンジ
    if (score >= 4) return "bg-[#63b2cd]";     // 水色
    return "bg-[#90a4ae]";                     // グレー（低）
  };

  // AIスコアに応じた色（高いほど暖色）
  // スコアは0〜100の範囲
  const getAIScoreColor = (score: number | undefined) => {
    if (!score) return "bg-[#90a4ae]";          // グレー（未評価）
    if (score >= 80) return "bg-[#e53935]";     // 赤（最高）
    if (score >= 60) return "bg-[#fb8c00]";     // オレンジ
    if (score >= 40) return "bg-[#63b2cd]";     // 水色
    return "bg-[#90a4ae]";                      // グレー（低）
  };

  const isValidSelection = selectedTalentIds.size >= 1;

  return (
    <div className="min-h-screen bg-[var(--pw-bg-body)]">
      {/* ヘッダー */}
      <header className="bg-[var(--pw-bg-sidebar)] text-white sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--pw-button-primary)] rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">AIマッチングダッシュボード</h1>
                <p className="text-sm opacity-80">案件と人材の最適なマッチングを支援</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* バッチ設定ボタン */}
              <button
                onClick={() => setShowBatchSettings(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                バッチ設定
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/10 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-[1920px] mx-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-[var(--pw-alert-error-bg)] border border-[var(--pw-alert-error)] rounded-xl text-[var(--pw-alert-error)] flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto hover:opacity-70 rounded-full p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          {/* 左側: 案件一覧 */}
          <div className="col-span-4 bg-white rounded-xl shadow-sm border border-[var(--pw-border-lighter)] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--pw-border-lighter)] bg-[var(--pw-bg-light-blue)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--pw-button-primary)] rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h2 className="font-bold text-[var(--pw-text-primary)]">案件一覧</h2>
                </div>
                <span className="text-sm text-[var(--pw-text-gray)] bg-white px-2.5 py-1 rounded-full border border-[var(--pw-border-lighter)]">
                  {filteredJobs.length}件
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="案件を検索..."
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[var(--pw-border-gray)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pw-button-primary)] focus:border-transparent transition-all"
                />
                <svg className="w-4 h-4 text-[var(--pw-text-light-gray)] absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {/* 実案件/非実案件フィルター */}
              <div className="flex items-center gap-4 mt-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showActiveJobs}
                    onChange={(e) => setShowActiveJobs(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-[var(--pw-border-gray)] bg-white accent-[var(--pw-button-primary)] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[var(--pw-text-primary)]">実案件</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactiveJobs}
                    onChange={(e) => setShowInactiveJobs(e.target.checked)}
                    className="w-4 h-4 rounded border-2 border-[var(--pw-border-gray)] bg-white accent-[var(--pw-button-primary)] cursor-pointer"
                  />
                  <span className="text-sm font-medium text-[var(--pw-text-primary)]">非実案件</span>
                </label>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoadingJobs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin h-10 w-10 border-3 border-[var(--pw-button-primary)] border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-[var(--pw-text-gray)]">読み込み中...</p>
                  </div>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[var(--pw-text-light-gray)]">
                  <p className="text-sm">案件が見つかりません</p>
                </div>
              ) : (
                filteredJobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id;
                  const isDisabled = job.listingStatus === "無";
                  return (
                    <div
                      key={job.id}
                      onClick={() => !isDisabled && handleSelectJob(job)}
                      className={`p-4 rounded-xl transition-all duration-200 ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed bg-gray-100 border border-gray-200"
                          : isSelected
                          ? "bg-[var(--pw-bg-light-blue)] border-2 border-[var(--pw-button-primary)] shadow-md cursor-pointer"
                          : "bg-white border border-[var(--pw-border-lighter)] hover:border-[var(--pw-button-primary)] hover:shadow-sm cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {isSelected && !isDisabled && (
                          <div className="w-5 h-5 bg-[var(--pw-button-primary)] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className={`font-semibold text-sm line-clamp-2 ${isDisabled ? "text-gray-500" : isSelected ? "text-[var(--pw-button-dark)]" : "text-[var(--pw-text-primary)]"}`}>
                              {job.title}
                            </h3>
                            {isDisabled && (
                              <span className="text-[10px] px-2 py-0.5 bg-gray-400 text-white rounded-full flex-shrink-0">
                                対象外
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {job.positions.slice(0, 2).map((pos, i) => (
                              <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full ${isDisabled ? "bg-gray-300 text-gray-600" : "bg-[var(--pw-bg-sidebar)] text-white"}`}>
                                {pos}
                              </span>
                            ))}
                            {job.positions.length > 2 && (
                              <span className="text-[10px] px-2 py-0.5 bg-[var(--pw-border-lighter)] text-[var(--pw-text-gray)] rounded-full">
                                +{job.positions.length - 2}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[var(--pw-text-gray)]">
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {job.location || "未設定"}
                            </span>
                            {job.rate && (
                              <span className={`font-medium ${isDisabled ? "text-gray-500" : "text-[var(--pw-button-primary)]"}`}>
                                {job.rate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 右側: 候補者一覧 */}
          <div className="col-span-8 bg-white rounded-xl shadow-sm border border-[var(--pw-border-lighter)] overflow-hidden flex flex-col">
            {/* ヘッダー: タイトルとステータス */}
            <div className="px-4 pt-4 pb-3 border-b border-[var(--pw-border-lighter)] bg-[var(--pw-bg-light-blue)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--pw-bg-sidebar)] rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--pw-text-primary)]">候補者一覧</h2>
                    {selectedJob && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-[var(--pw-text-gray)]">
                          {selectedJob.title}
                        </p>
                        <a
                          href={`${KINTONE_BASE_URL}/k/${KINTONE_JOB_APP_ID}/show#record=${selectedJob.jobId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--pw-button-primary)] hover:underline flex items-center gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          kintone
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* ステータスバッジ */}
                {talents.length > 0 && (
                  <div className="flex items-center gap-2">
                    {staffRecommendCount > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#fef3c7] rounded-lg border border-[#f59e0b]">
                        <span className="text-xs text-[#b45309]">おすすめ</span>
                        <span className="text-sm font-bold text-[#b45309]">{staffRecommendCount}</span>
                        <span className="text-xs text-[#b45309]">名</span>
                      </div>
                    )}
                    {aiEvaluatedCount > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-[#eff6ff] rounded-lg border border-[var(--pw-button-primary)]">
                        <span className="text-xs text-[var(--pw-button-primary)]">AI評価</span>
                        <span className="text-sm font-bold text-[var(--pw-button-primary)]">{aiEvaluatedCount}</span>
                        <span className="text-xs text-[var(--pw-button-primary)]">名</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* ソートバー */}
            {talents.length > 0 && (
              <div className="px-4 py-2.5 border-b border-[var(--pw-border-lighter)] bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--pw-text-gray)]">並び替え:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-xs px-2 py-1 bg-[var(--pw-bg-body)] border border-[var(--pw-border-gray)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--pw-button-primary)]"
                  >
                    <option value="score">スコア順</option>
                    <option value="staffRecommend">おすすめ優先</option>
                    <option value="aiOverall">AI Score順</option>
                  </select>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {!selectedJob ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--pw-text-light-gray)]">
                  <div className="w-24 h-24 bg-[var(--pw-bg-light-blue)] rounded-full flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-[var(--pw-button-primary)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-[var(--pw-text-gray)] mb-1">案件を選択してください</p>
                  <p className="text-sm">左側の案件一覧から案件をクリックすると候補者を確認できます</p>
                </div>
              ) : isLoadingTalents ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="relative mx-auto w-16 h-16 mb-4">
                      <div className="absolute inset-0 border-4 border-[var(--pw-border-lighter)] rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-[var(--pw-button-primary)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-[var(--pw-text-primary)] font-medium mb-1">候補者を取得中...</p>
                    <p className="text-sm text-[var(--pw-text-gray)]">しばらくお待ちください</p>
                  </div>
                </div>
              ) : talents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--pw-text-light-gray)]">
                  <p className="text-lg font-medium text-[var(--pw-text-gray)] mb-1">マッチする人材がいません</p>
                  <p className="text-sm">この案件に適合する人材が見つかりませんでした</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {sortedTalents.map((talent, index) => {
                    const isSelected = selectedTalentIds.has(talent.authUserId);
                    const isExpanded = expandedTalentId === talent.authUserId;
                    const hasAIEvaluation = talent.aiExecutionStatus === "実行済み";
                    const isStaffRecommend = talent.staffRecommend;

                    return (
                      <div
                        key={talent.authUserId}
                        className={`rounded-xl border-2 transition-all duration-300 relative self-start ${
                          isStaffRecommend
                            ? "border-[#f59e0b] bg-[#fffbeb] shadow-md"
                            : isSelected
                            ? "border-[var(--pw-button-primary)] bg-[var(--pw-bg-light-blue)] shadow-lg"
                            : "border-[var(--pw-border-lighter)] bg-white hover:border-[var(--pw-border-light)] hover:shadow-md"
                        }`}
                      >
                        {/* 担当者おすすめバッジ（左上に配置・目立つデザイン） */}
                        {isStaffRecommend && (
                          <div className="absolute -top-2 -left-2 z-10">
                            <div className="bg-[#f59e0b] text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              担当者おすすめ
                            </div>
                          </div>
                        )}

                        {/* おすすめトグルボタン（右上に配置） */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRecommend(talent);
                          }}
                          disabled={settingRecommendIds.has(talent.authUserId)}
                          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all z-10 ${
                            settingRecommendIds.has(talent.authUserId)
                              ? "opacity-50 cursor-not-allowed"
                              : isStaffRecommend
                              ? "bg-[#f59e0b] text-white hover:bg-[#d97706]"
                              : "bg-[var(--pw-border-lighter)] text-[var(--pw-text-light-gray)] hover:bg-[#fef3c7] hover:text-[#f59e0b]"
                          }`}
                          title={isStaffRecommend ? "おすすめを解除" : "おすすめに設定"}
                        >
                          <svg className="w-4 h-4" fill={isStaffRecommend ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>

                        <div
                          className={`p-4 ${hasAIEvaluation ? "cursor-not-allowed" : "cursor-pointer"}`}
                          onClick={() => {
                            if (!hasAIEvaluation) {
                              handleToggleTalent(talent.authUserId);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* チェックボックス＋ランク */}
                            <div className="flex flex-col items-center gap-2">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                hasAIEvaluation
                                  ? "bg-[var(--pw-border-lighter)] border-[var(--pw-border-lighter)] cursor-not-allowed"
                                  : isSelected
                                  ? "bg-[var(--pw-button-primary)] border-[var(--pw-button-primary)]"
                                  : "border-[var(--pw-border-gray)] bg-white"
                              }`}>
                                {hasAIEvaluation ? (
                                  <svg className="w-4 h-4 text-[var(--pw-text-light-gray)]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : isSelected ? (
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : null}
                              </div>
                              {/* ランキング表示 */}
                              <div className="text-center">
                                <span className="text-[10px] text-[var(--pw-text-light-gray)]">順位</span>
                                <div className={`text-lg font-bold ${
                                  index < 3
                                    ? "text-[var(--pw-alert-warning)]"
                                    : "text-[var(--pw-text-gray)]"
                                }`}>
                                  {index + 1}
                                </div>
                              </div>
                            </div>

                            {/* メイン情報 */}
                            <div className="flex-1 min-w-0 pr-8">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-[var(--pw-text-primary)] truncate">{talent.name}</h3>
                                <a
                                  href={`${KINTONE_BASE_URL}/k/${KINTONE_TALENT_APP_ID}/show#record=${talent.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-[var(--pw-button-primary)] hover:underline flex items-center gap-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  kintone
                                </a>
                              </div>
                              
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${getMatchScoreColor(talent.score)}`}>
                                  スコア {talent.score}pt
                                </span>
                              </div>

                              {talent.positions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {talent.positions.slice(0, 2).map((pos, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 bg-[var(--pw-border-lighter)] text-[var(--pw-text-gray)] rounded-full">
                                      {pos}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {talent.skills && (
                                <p className="text-xs text-[var(--pw-text-gray)] line-clamp-1 mb-2">
                                  <span className="text-[var(--pw-text-light-gray)]">スキル:</span> {talent.skills}
                                </p>
                              )}

                              {talent.desiredRate && (
                                <p className="text-xs">
                                  <span className="text-[var(--pw-text-light-gray)]">希望:</span>{" "}
                                  <span className="font-semibold text-[var(--pw-button-primary)]">{talent.desiredRate}</span>
                                </p>
                              )}
                            </div>

                            {/* AI評価サマリー */}
                            {hasAIEvaluation && (
                              <div className="flex flex-col items-center">
                                <RadarChart
                                  scores={{
                                    skill: talent.aiSkillScore || 0,
                                    process: talent.aiProcessScore || 0,
                                    infra: talent.aiInfraScore || 0,
                                    domain: talent.aiDomainScore || 0,
                                    team: talent.aiTeamScore || 0,
                                    tool: talent.aiToolScore || 0,
                                  }}
                                  size={80}
                                />
                                <div className={`-mt-1 px-3 py-1 rounded-full text-[10px] font-bold text-white ${getAIScoreColor(talent.aiOverallScore)}`}>
                                  AI Score {talent.aiOverallScore}点
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* カードフッター（高さ統一用・角丸対応） */}
                        <div className="border-t border-[var(--pw-border-lighter)] rounded-b-[11px] overflow-hidden">
                          {hasAIEvaluation ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedTalentId(isExpanded ? null : talent.authUserId);
                                }}
                                className="w-full px-4 py-3 text-xs text-[var(--pw-button-primary)] hover:bg-[var(--pw-bg-light-blue)] flex items-center justify-center gap-1 transition-colors"
                              >
                                {isExpanded ? "詳細を閉じる" : "AI評価詳細を見る"}
                                <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>

                              {isExpanded && (
                                <div className="px-4 pb-4 space-y-3 border-t border-[var(--pw-border-lighter)]">
                                  <div className="grid grid-cols-2 gap-2 pt-3">
                                    <ScoreBar score={talent.aiSkillScore || 0} label="技術" compact />
                                    <ScoreBar score={talent.aiProcessScore || 0} label="工程" compact />
                                    <ScoreBar score={talent.aiInfraScore || 0} label="インフラ" compact />
                                    <ScoreBar score={talent.aiDomainScore || 0} label="業務" compact />
                                    <ScoreBar score={talent.aiTeamScore || 0} label="チーム" compact />
                                    <ScoreBar score={talent.aiToolScore || 0} label="ツール" compact />
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShowAIResult(talent);
                                    }}
                                    className="w-full py-2 text-xs bg-[var(--pw-bg-light-blue)] text-[var(--pw-button-primary)] rounded-lg hover:bg-[var(--pw-border-lighter)] transition-colors font-medium"
                                  >
                                    📝 詳細評価レポートを見る
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="px-4 py-3 text-center text-xs text-[var(--pw-text-light-gray)] bg-[var(--pw-bg-body)] hover:bg-[var(--pw-bg-light-blue)] transition-colors">
                              AI評価未実施
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* フローティングアクションバー（AIマッチ用） */}
      {selectedTalentIds.size > 0 && talents.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--pw-bg-sidebar)] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--pw-button-primary)] rounded-full flex items-center justify-center font-bold">
              {selectedTalentIds.size}
            </div>
            <span className="text-sm">名選択中</span>
          </div>
          <div className="h-6 w-px bg-white/30" />
          <button
            onClick={() => setSelectedTalentIds(new Set())}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            クリア
          </button>
          <button
            onClick={handleAIMatch}
            className="px-4 py-2 bg-[var(--pw-button-primary)] rounded-xl font-medium text-sm flex items-center gap-2 hover:opacity-90 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AIマッチ実行
          </button>
        </div>
      )}

      {/* AIマッチ実行中のローディング */}
      {isAIMatching && (
        <div className="fixed inset-0 bg-[var(--pw-overlay)] flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-2xl">
            <div className="relative mx-auto w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-[var(--pw-border-lighter)] rounded-full"></div>
              <div className="absolute inset-0 border-4 border-[var(--pw-button-primary)] border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-3 border-4 border-[var(--pw-border-lighter)] rounded-full"></div>
              <div className="absolute inset-3 border-4 border-[var(--pw-bg-sidebar)] border-t-transparent rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[var(--pw-text-primary)] mb-3">
              AI評価を実行中...
            </h3>
            <p className="text-[var(--pw-text-gray)] mb-6">
              選択された <span className="font-bold text-[var(--pw-button-primary)]">{selectedTalentIds.size}</span> 名の人材を評価しています
            </p>
            <p className="text-xs text-[var(--pw-text-light-gray)]">
              この処理には数十秒かかる場合があります
            </p>
          </div>
        </div>
      )}

      {/* AI評価結果モーダル */}
      {showResultModal && (
        <div className="fixed inset-0 bg-[var(--pw-overlay)] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* モーダルヘッダー */}
            <div className="bg-[var(--pw-bg-sidebar)] p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--pw-button-primary)] rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">AI評価結果</h3>
                    {selectedResultTalent ? (
                      <p className="mt-1 opacity-90">{selectedResultTalent.name} さんの詳細評価</p>
                    ) : (
                      <p className="mt-1 opacity-90">{aiMatchResults.length} 名の評価が完了しました</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setSelectedResultTalent(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {selectedResultTalent ? (
                <div className="space-y-6">
                  {/* スコアサマリー */}
                  <div className="bg-[var(--pw-bg-body)] rounded-xl p-6">
                    <div className="flex items-center justify-center gap-8 mb-8">
                      <RadarChart
                        scores={{
                          skill: selectedResultTalent.aiSkillScore || 0,
                          process: selectedResultTalent.aiProcessScore || 0,
                          infra: selectedResultTalent.aiInfraScore || 0,
                          domain: selectedResultTalent.aiDomainScore || 0,
                          team: selectedResultTalent.aiTeamScore || 0,
                          tool: selectedResultTalent.aiToolScore || 0,
                        }}
                        size={200}
                        showLabels
                      />
                      <div className="text-center">
                        <p className="text-sm text-[var(--pw-text-gray)] mb-2">AI Score（総合）</p>
                        <div className={`text-6xl font-bold ${
                          (selectedResultTalent.aiOverallScore || 0) >= 80 ? "text-[#e53935]" :
                          (selectedResultTalent.aiOverallScore || 0) >= 60 ? "text-[#fb8c00]" :
                          (selectedResultTalent.aiOverallScore || 0) >= 40 ? "text-[#63b2cd]" :
                          "text-[#90a4ae]"
                        }`}>
                          {selectedResultTalent.aiOverallScore}
                        </div>
                        <p className="text-sm text-[var(--pw-text-gray)] mt-1">/ 100点</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <ScoreBar score={selectedResultTalent.aiSkillScore || 0} label="💻 技術スキル" />
                      <ScoreBar score={selectedResultTalent.aiProcessScore || 0} label="🔧 開発工程" />
                      <ScoreBar score={selectedResultTalent.aiInfraScore || 0} label="☁️ インフラ/クラウド" />
                      <ScoreBar score={selectedResultTalent.aiDomainScore || 0} label="📊 業務知識" />
                      <ScoreBar score={selectedResultTalent.aiTeamScore || 0} label="👥 チーム開発" />
                      <ScoreBar score={selectedResultTalent.aiToolScore || 0} label="🛠️ ツール/環境" />
                    </div>
                  </div>

                  {/* 詳細評価テキスト（Markdown表示） */}
                  {selectedResultTalent.aiResult && (
                    <div className="bg-white border border-[var(--pw-border-lighter)] rounded-xl p-6">
                      <h4 className="text-lg font-bold text-[var(--pw-text-primary)] mb-4 flex items-center gap-2">
                        <span>📝</span> 詳細評価
                      </h4>
                      <div className="prose prose-sm max-w-none text-[var(--pw-text-primary)]">
                        <ReactMarkdown
                          components={{
                            h2: ({ children }) => <h2 className="text-lg font-bold text-[var(--pw-text-primary)] mt-6 mb-3 pb-2 border-b border-[var(--pw-border-lighter)]">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-bold text-[var(--pw-text-primary)] mt-4 mb-2">{children}</h3>,
                            p: ({ children }) => <p className="text-sm text-[var(--pw-text-gray)] mb-3 leading-relaxed">{children}</p>,
                            strong: ({ children }) => <strong className="font-bold text-[var(--pw-text-primary)]">{children}</strong>,
                            hr: () => <hr className="my-4 border-[var(--pw-border-lighter)]" />,
                          }}
                        >
                          {selectedResultTalent.aiResult}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {aiMatchResults.map((result, index) => (
                    <div
                      key={result.talentAuthUserId}
                      className="bg-[var(--pw-bg-body)] rounded-xl p-4 hover:bg-[var(--pw-bg-light-blue)] transition-colors cursor-pointer"
                      onClick={() => {
                        const talent = talents.find(t => t.authUserId === result.talentAuthUserId);
                        if (talent) {
                          setSelectedResultTalent(talent);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[var(--pw-bg-sidebar)] text-white flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-[var(--pw-text-primary)]">{result.talentName}</h4>
                            {result.result.error ? (
                              <p className="text-sm text-[var(--pw-alert-error)]">⚠️ {result.result.error}</p>
                            ) : (
                              <div className="flex items-center gap-3 mt-1">
                                <span className={`text-sm font-bold px-3 py-0.5 rounded-full text-white ${getAIScoreColor(result.result.overallScore)}`}>
                                  AI Score {result.result.overallScore}点
                                </span>
                                <span className="text-xs text-[var(--pw-text-gray)]">
                                  技術:{result.result.skillScore} / 工程:{result.result.processScore} / インフラ:{result.result.infraScore}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-[var(--pw-text-light-gray)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedResultTalent && aiMatchResults.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setSelectedResultTalent(null)}
                    className="text-[var(--pw-button-primary)] hover:underline font-medium flex items-center gap-1 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    一覧に戻る
                  </button>
                </div>
              )}
            </div>

            {/* モーダルフッター */}
            <div className="border-t border-[var(--pw-border-lighter)] p-4 bg-[var(--pw-bg-body)] flex justify-end">
              <button
                onClick={() => {
                  setShowResultModal(false);
                  setSelectedResultTalent(null);
                }}
                className="px-6 py-2.5 bg-[var(--pw-bg-sidebar)] text-white rounded-xl font-medium hover:opacity-90 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* バッチ設定モーダル */}
      {showBatchSettings && (
        <div className="fixed inset-0 bg-[var(--pw-overlay)] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            {/* モーダルヘッダー */}
            <div className="bg-[var(--pw-bg-sidebar)] p-5 rounded-t-2xl text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--pw-button-primary)] rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">推薦リスト設定</h3>
                    <p className="text-sm opacity-80">候補者抽出の条件を設定</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBatchSettings(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* モーダルコンテンツ */}
            <div className="p-6 space-y-6">
              {/* スコア閾値設定 */}
              <div>
                <label className="block text-sm font-medium text-[var(--pw-text-primary)] mb-2">
                  マッチングスコア閾値
                </label>
                <p className="text-xs text-[var(--pw-text-gray)] mb-3">
                  この値以上のスコアを持つ候補者のみが推薦リストに表示されます
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={scoreThreshold}
                    onChange={(e) => setScoreThreshold(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                    className="w-24 px-3 py-2 border border-[var(--pw-border-gray)] rounded-lg text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[var(--pw-button-primary)] focus:border-transparent"
                  />
                  <span className="text-sm text-[var(--pw-text-gray)]">ポイント以上</span>
                </div>
              </div>

              {/* 説明 */}
              <div className="bg-[var(--pw-bg-body)] rounded-xl p-4">
                <h4 className="text-sm font-medium text-[var(--pw-text-primary)] mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--pw-button-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ご注意
                </h4>
                <ul className="text-xs text-[var(--pw-text-gray)] space-y-1">
                  <li>• AIマッチ済みの候補者は常に保持されます</li>
                  <li>• 担当者おすすめの候補者は常に保持されます</li>
                  <li>• それ以外の候補者は定期的に再計算されます</li>
                </ul>
              </div>
            </div>

            {/* モーダルフッター */}
            <div className="border-t border-[var(--pw-border-lighter)] p-4 bg-[var(--pw-bg-body)] rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowBatchSettings(false)}
                disabled={isSavingSettings}
                className="px-4 py-2 text-sm text-[var(--pw-text-gray)] hover:text-[var(--pw-text-primary)] transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveBatchSettings}
                disabled={isSavingSettings}
                className="px-4 py-2 bg-[var(--pw-button-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingSettings ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    保存中...
                  </>
                ) : (
                  "設定を保存"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* トースト通知 */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e5e7eb',
          },
        }}
      />
    </div>
  );
};

export default AdminDashboardPage;
