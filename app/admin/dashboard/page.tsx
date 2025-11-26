"use client";

/**
 * 管理者ダッシュボード - 案件マッチング画面
 * /admin/dashboard
 * 
 * 左側: 案件一覧
 * 右側: 選択した案件に対して「候補者抽出」ボタンで人材を抽出
 *       上位10人を表示し、3〜5人を選択して「AIマッチ実行」
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
};

const AdminDashboardPage = () => {
  const router = useRouter();
  
  // 状態管理
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [selectedTalentIds, setSelectedTalentIds] = useState<Set<string>>(new Set());
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);
  const [error, setError] = useState("");

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

  // 案件選択時の処理（推薦DB確認）
  const handleSelectJob = async (job: Job) => {
    setSelectedJob(job);
    setSelectedTalentIds(new Set());
    setError("");
    
    // 推薦DBに既存データがあるか確認
    try {
      setIsExtracting(true);
      const response = await fetch(`/api/admin/recommendations/${job.jobId}`);
      
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();
      
      if (response.ok && data.talents && data.talents.length > 0) {
        // 既存データがある場合は表示
        setTalents(data.talents);
        setHasExtracted(true);
      } else {
        // 既存データがない場合は未抽出状態
        setTalents([]);
        setHasExtracted(false);
      }
    } catch (error) {
      console.error("推薦データ確認エラー:", error);
      setTalents([]);
      setHasExtracted(false);
    } finally {
      setIsExtracting(false);
    }
  };

  // マッチングスコア計算＆推薦DB保存処理
  const handleExtractCandidates = async () => {
    if (!selectedJob) return;

    try {
      setIsExtracting(true);
      setError("");
      
      // ステップ1: マッチングスコア計算＆推薦DB保存
      const extractResponse = await fetch(`/api/admin/extract/${selectedJob.jobId}`, {
        method: "POST",
      });
      
      if (extractResponse.status === 401) {
        router.push("/admin/login");
        return;
      }

      const extractData = await extractResponse.json();
      
      if (!extractResponse.ok) {
        setError(extractData.error || "候補者抽出に失敗しました");
        return;
      }

      // ステップ2: 推薦DBから候補者データを取得
      const recsResponse = await fetch(`/api/admin/recommendations/${selectedJob.jobId}`);
      
      if (recsResponse.status === 401) {
        router.push("/admin/login");
        return;
      }

      const recsData = await recsResponse.json();
      
      if (!recsResponse.ok) {
        setError(recsData.error || "候補者データの取得に失敗しました");
        return;
      }

      setTalents(recsData.talents);
      setHasExtracted(true);
      setSelectedTalentIds(new Set());
    } catch (error) {
      console.error("候補者抽出エラー:", error);
      setError("通信エラーが発生しました");
    } finally {
      setIsExtracting(false);
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

  // AIマッチ実行（未実装 - UIのみ）
  const handleAIMatch = () => {
    // TODO: AIマッチ実行処理を実装
    console.log("AIマッチ実行:", {
      jobId: selectedJob?.jobId,
      selectedTalentIds: Array.from(selectedTalentIds),
    });
    alert(`AIマッチ実行機能は現在開発中です\n\n選択された人材: ${selectedTalentIds.size}名`);
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

  // スコアに応じた色を取得
  const getScoreColor = (score: number) => {
    if (score >= 10) return "bg-emerald-500";
    if (score >= 5) return "bg-[var(--pw-button-primary)]";
    if (score >= 1) return "bg-amber-500";
    return "bg-gray-400";
  };

  // スコアに応じたラベルを取得
  const getScoreLabel = (score: number) => {
    if (score >= 10) return "高マッチ";
    if (score >= 5) return "中マッチ";
    if (score >= 1) return "低マッチ";
    return "参考";
  };

  // 選択数のバリデーション
  const isValidSelection = selectedTalentIds.size >= 3 && selectedTalentIds.size <= 5;

  return (
    <div className="min-h-screen bg-[var(--pw-bg-body)]">
      {/* ヘッダー */}
      <header className="bg-[var(--pw-bg-sidebar)] text-white shadow-lg">
        <div className="max-w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--pw-button-primary)] rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">ProWorks Admin</h1>
              <p className="text-xs text-[var(--pw-text-light-gray)]">
                案件マッチング管理
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ログアウト
          </button>
        </div>
      </header>

      {/* エラーメッセージ */}
      {error && (
        <div className="max-w-full mx-auto px-6 pt-4">
          <div className="bg-[var(--pw-alert-error-bg)] border border-[var(--pw-alert-error)] rounded-lg p-4">
            <p className="text-[var(--pw-alert-error)] text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-full mx-auto p-6">
        <div className="flex gap-6 h-[calc(100vh-140px)]">
          {/* 左側: 案件一覧 */}
          <div className="w-[35%] flex flex-col">
            <div className="bg-white rounded-xl shadow-sm border border-[var(--pw-border-lighter)] flex flex-col h-full">
              <div className="p-4 border-b border-[var(--pw-border-lighter)]">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--pw-button-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h2 className="font-bold text-[var(--pw-text-primary)]">案件一覧</h2>
                  <span className="ml-auto text-sm text-[var(--pw-text-light-gray)]">
                    {jobs.length}件
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingJobs ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-[var(--pw-button-primary)] border-t-transparent rounded-full" />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12 text-[var(--pw-text-light-gray)]">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>案件がありません</p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => handleSelectJob(job)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        selectedJob?.id === job.id
                          ? "border-[var(--pw-button-primary)] bg-[var(--pw-bg-light-blue)]"
                          : "border-transparent bg-[var(--pw-bg-body)] hover:bg-[var(--pw-bg-light-blue)] hover:border-[var(--pw-border-lighter)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-[var(--pw-text-primary)] line-clamp-2">
                          {job.title}
                        </h3>
                        {selectedJob?.id === job.id && (
                          <svg className="w-5 h-5 text-[var(--pw-button-primary)] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      
                      {job.positions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {job.positions.slice(0, 2).map((pos, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 bg-[var(--pw-bg-sidebar)] text-white rounded"
                            >
                              {pos}
                            </span>
                          ))}
                          {job.positions.length > 2 && (
                            <span className="text-xs text-[var(--pw-text-light-gray)]">
                              +{job.positions.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {job.skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {job.skills.slice(0, 3).map((skill, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 bg-[var(--pw-button-primary)]/10 text-[var(--pw-button-primary)] rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 3 && (
                            <span className="text-xs text-[var(--pw-text-light-gray)]">
                              +{job.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-3 text-xs text-[var(--pw-text-gray)]">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                          </span>
                        )}
                        {job.rate && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {job.rate}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 右側: 候補者抽出エリア */}
          <div className="w-[65%] flex flex-col">
            <div className="bg-white rounded-xl shadow-sm border border-[var(--pw-border-lighter)] flex flex-col h-full">
              <div className="p-4 border-b border-[var(--pw-border-lighter)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--pw-button-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h2 className="font-bold text-[var(--pw-text-primary)]">
                      候補者一覧
                    </h2>
                    {hasExtracted && talents.length > 0 && (
                      <span className="ml-2 text-sm text-[var(--pw-text-light-gray)]">
                        上位{talents.length}名
                      </span>
                    )}
                  </div>
                  
                  {/* 選択状態とAIマッチボタン */}
                  {hasExtracted && talents.length > 0 && (
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${isValidSelection ? "text-[var(--pw-button-primary)]" : "text-[var(--pw-text-gray)]"}`}>
                        {selectedTalentIds.size}名選択中
                        {!isValidSelection && selectedTalentIds.size > 0 && (
                          <span className="text-xs ml-1">(3〜5名を選択)</span>
                        )}
                      </span>
                      <button
                        onClick={handleAIMatch}
                        disabled={!isValidSelection}
                        className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                          isValidSelection
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AIマッチ実行
                      </button>
                    </div>
                  )}
                </div>
                {selectedJob && (
                  <p className="mt-1 text-sm text-[var(--pw-text-gray)]">
                    選択中: <span className="font-medium text-[var(--pw-text-primary)]">{selectedJob.title}</span>
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!selectedJob ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--pw-text-light-gray)]">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    <p className="text-lg font-medium">案件を選択してください</p>
                    <p className="text-sm mt-1">左側の案件一覧から案件をクリックすると</p>
                    <p className="text-sm">候補者を抽出できます</p>
                  </div>
                ) : isExtracting && !hasExtracted ? (
                  // 案件選択時のローディング（候補者がまだ抽出されていない）
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin h-12 w-12 border-4 border-[var(--pw-button-primary)] border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-[var(--pw-text-primary)] font-medium mb-2">候補者データを確認中...</p>
                      <p className="text-sm text-[var(--pw-text-gray)]">推薦DBからデータを取得しています</p>
                    </div>
                  </div>
                ) : !hasExtracted ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-center">
                      <svg className="w-20 h-20 mx-auto mb-4 text-[var(--pw-button-primary)] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-lg font-medium text-[var(--pw-text-primary)] mb-2">
                        候補者を抽出する
                      </p>
                      <p className="text-sm text-[var(--pw-text-gray)] mb-6">
                        案件の要件に基づいて、マッチする人材を検索します
                      </p>
                      <button
                        onClick={handleExtractCandidates}
                        disabled={isExtracting}
                        className="px-6 py-3 bg-[var(--pw-button-primary)] text-white rounded-xl font-medium hover:bg-[var(--pw-button-primary-hover)] transition-colors flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExtracting ? (
                          <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            抽出中...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            候補者抽出
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : isExtracting && hasExtracted ? (
                  // 候補者抽出ボタン押下時のローディング（候補者を再抽出中）
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin h-12 w-12 border-4 border-[var(--pw-button-primary)] border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-[var(--pw-text-primary)] font-medium mb-2">候補者を抽出中...</p>
                      <p className="text-sm text-[var(--pw-text-gray)]">マッチングスコアを計算して推薦DBに保存しています</p>
                    </div>
                  </div>
                ) : talents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--pw-text-light-gray)]">
                    <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <p className="text-lg font-medium">マッチする人材がいません</p>
                    <p className="text-sm mt-1">この案件に適合する人材が見つかりませんでした</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 選択ガイド */}
                    <div className="bg-[var(--pw-bg-light-blue)] rounded-lg p-3 text-sm text-[var(--pw-text-gray)]">
                      <span className="font-medium">💡 ヒント:</span> 3〜5名を選択して「AIマッチ実行」をクリックしてください
                    </div>
                    
                    {talents.map((talent, index) => {
                      const isSelected = selectedTalentIds.has(talent.authUserId);
                      
                      return (
                        <div
                          key={talent.id}
                          onClick={() => handleToggleTalent(talent.authUserId)}
                          className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? "border-[var(--pw-button-primary)] bg-[var(--pw-bg-light-blue)]"
                              : "border-[var(--pw-border-lighter)] bg-[var(--pw-bg-body)] hover:border-[var(--pw-button-primary)]/50"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* チェックボックス */}
                            <div className="flex-shrink-0 mt-1">
                              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                                isSelected
                                  ? "bg-[var(--pw-button-primary)] border-[var(--pw-button-primary)]"
                                  : "border-gray-300 bg-white"
                              }`}>
                                {isSelected && (
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>

                            {/* ランキング表示 */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--pw-bg-sidebar)] text-white flex items-center justify-center font-bold">
                              {index + 1}
                            </div>

                            {/* メイン情報 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-bold text-lg text-[var(--pw-text-primary)]">
                                  {talent.name}
                                </h3>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getScoreColor(talent.score)}`}>
                                  スコア: {talent.score} ({getScoreLabel(talent.score)})
                                </div>
                              </div>

                              {/* 職種 */}
                              {talent.positions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {talent.positions.map((pos, i) => (
                                    <span
                                      key={i}
                                      className="text-xs px-2 py-0.5 bg-[var(--pw-bg-sidebar)] text-white rounded"
                                    >
                                      {pos}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* スキル */}
                              {talent.skills && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-[var(--pw-text-gray)] mb-1">
                                    スキル・言語
                                  </p>
                                  <p className="text-sm text-[var(--pw-text-primary)] line-clamp-2">
                                    {talent.skills}
                                  </p>
                                </div>
                              )}

                              {/* 経歴 */}
                              {talent.experience && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-[var(--pw-text-gray)] mb-1">
                                    主な実績・経歴
                                  </p>
                                  <p className="text-sm text-[var(--pw-text-primary)] line-clamp-3">
                                    {talent.experience}
                                  </p>
                                </div>
                              )}

                              {/* 希望単価 */}
                              {talent.desiredRate && (
                                <div className="mt-3 flex items-center gap-2 text-sm">
                                  <span className="text-[var(--pw-text-gray)]">希望単価:</span>
                                  <span className="font-semibold text-[var(--pw-button-primary)]">
                                    {talent.desiredRate}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
