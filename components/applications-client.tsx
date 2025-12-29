"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { FullWidthLayout } from "@/components/layouts"
import { DashboardFilters, type JobFilters } from "@/components/dashboard-filters"
import { JobCard } from "@/components/job-card"
import { JobDetailModal } from "@/components/job-detail-modal"
import { AiRecommendedJobsCarousel } from "@/components/ai-recommended-jobs-carousel"
import { useApplicationStatusMonitor } from "@/hooks/use-application-status-monitor"
import { useWithdrawalCheck } from "@/hooks/use-withdrawal-check"
import { useToast } from "@/hooks/use-toast"
import type { Job } from "@/lib/kintone/types"
import { mapApplicationStatusToDisplay } from "@/lib/utils"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSquareCheck } from "@fortawesome/free-regular-svg-icons"

interface ApplicationsClientProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
  // SSRで事前取得した応募データ（初期表示高速化用）
  initialApplications?: any[]
}

// ステータスフィルターの定義（kintoneの値をキーとして使用、表示は変換後のラベル）
type StatusFilter = "all" | "応募済み" | "面談調整中" | "面談予定" | "案件参画" | "見送り"

const STATUS_FILTERS: { id: StatusFilter; kintoneValues: string[]; label: string }[] = [
  { id: "all", kintoneValues: ["all"], label: "すべて" },
  { id: "案件参画", kintoneValues: ["案件参画"], label: "案件決定" },
  { id: "面談調整中", kintoneValues: ["面談調整中"], label: "面談調整中" },
  { id: "面談予定", kintoneValues: ["予定決定", "面談予定"], label: "面談確定" }, // 予定決定と面談予定の両方に対応
  { id: "応募済み", kintoneValues: ["応募済み"], label: "応募済み" },
  { id: "見送り", kintoneValues: ["見送り"], label: "募集終了" },
]

// フィルター用の青色
const filterBlue = "#3966a2"

export const ApplicationsClient = ({ user, initialApplications = [] }: ApplicationsClientProps) => {
  const { handleWithdrawalError } = useWithdrawalCheck()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // SSRで事前取得したデータがあれば即座に表示（loading=false）
  const hasInitialData = initialApplications.length > 0
  const [applications, setApplications] = useState<any[]>(initialApplications)
  const [loading, setLoading] = useState(!hasInitialData)

  // ステータス監視フックに取得済みデータを渡す（重複API呼び出し削減）
  useApplicationStatusMonitor(applications)

  // 応募済み案件IDをメモ化（JobDetailModalに渡すため）
  const appliedJobIds = useMemo(() => applications.map(app => app.jobId), [applications])
  const [aiMatchedJobs, setAiMatchedJobs] = useState<Job[]>([])
  const [aiMatchedJobsLoading, setAiMatchedJobsLoading] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all")

  // URLパラメータからjobIdを読み取り、案件詳細モーダルを開く
  useEffect(() => {
    const jobIdParam = searchParams.get("jobId")
    if (jobIdParam) {
      setSelectedJobId(jobIdParam)
    }
  }, [searchParams])

  // 初回ロード時の処理
  // SSRでデータ取得済みの場合は退会チェックのみ、そうでなければ両方取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // SSRでデータ取得済みの場合
        if (hasInitialData) {
          // 退会チェックのみ実行（バックグラウンド）
          const meRes = await fetch("/api/me")
          if (!meRes.ok) {
            await handleWithdrawalError(meRes)
          }
          return
        }

        // SSRでデータがない場合はCSRフォールバック
        setLoading(true)
        const [meRes, applicationsRes] = await Promise.all([
          fetch("/api/me"),
          fetch("/api/applications/me"),
        ])

        if (!meRes.ok) {
          await handleWithdrawalError(meRes)
          return
        }

        if (applicationsRes.ok) {
          const data = await applicationsRes.json()
          setApplications(data)
        }
      } catch (error) {
        console.error("データ取得エラー:", error)
      } finally {
        if (!hasInitialData) {
          setLoading(false)
        }
      }
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // AIマッチ案件を取得（応募済み案件が0件の場合のみ）
  useEffect(() => {
    const fetchAiMatchedJobs = async () => {
      if (applications.length > 0 || loading) return

      try {
        setAiMatchedJobsLoading(true)
        const res = await fetch("/api/recommended-jobs")
        if (res.ok) {
          const data = await res.json()
          // AIマッチの案件のみをフィルタリング
          const aiMatched = (data.items || []).filter((job: Job & { aiMatched?: boolean }) => job.aiMatched)
          setAiMatchedJobs(aiMatched)
        }
      } catch (error) {
        console.error("Failed to fetch AI matched jobs:", error)
      } finally {
        setAiMatchedJobsLoading(false)
      }
    }

    fetchAiMatchedJobs()
  }, [applications.length, loading])

  // ステータスの優先順位を定義（並び順に合わせる）
  const getStatusPriority = (status: string, recruitmentStatus?: string): number => {
    // 募集終了（最優先で最後に配置）
    if (status === "見送り" || recruitmentStatus === "クローズ") {
      return 5
    }
    
    // ステータスに基づく優先順位
    switch (status) {
      case "案件参画":
        return 1 // 案件決定
      case "予定決定":
      case "面談予定":
        return 2 // 面談確定
      case "面談調整中":
        return 3
      case "応募済み":
        return 4
      default:
        return 6 // その他は最後
    }
  }

  // フィルタリングとソートされた応募一覧
  const filteredApplications = useMemo(() => {
    let filtered = applications
    
    // フィルター適用
    if (activeFilter !== "all") {
      const filterConfig = STATUS_FILTERS.find((f) => f.id === activeFilter)
      if (filterConfig) {
        // kintoneの値でフィルタリング
        filtered = applications.filter((app) => 
          filterConfig.kintoneValues.includes(app.status)
        )
      }
    }
    
    // ステータスの優先順位でソート、同じ優先順位の場合は応募日時（新しい順）でソート
    const sorted = [...filtered].sort((a, b) => {
      const priorityA = getStatusPriority(a.status, a.job?.recruitmentStatus)
      const priorityB = getStatusPriority(b.status, b.job?.recruitmentStatus)
      
      // 優先順位が異なる場合は優先順位でソート
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      
      // 同じ優先順位の場合は応募日時（新しい順）でソート
      const dateA = new Date(a.appliedAt || 0).getTime()
      const dateB = new Date(b.appliedAt || 0).getTime()
      return dateB - dateA // 降順（新しい順）
    })
    
    return sorted
  }, [applications, activeFilter])

  // 応募詳細を見る
  const handleViewDetail = (jobId: string) => {
    setSelectedJobId(jobId)
  }

  // 応募詳細モーダルを閉じる（応募機能は使わない）
  const handleApply = () => {
    // 何もしない（既に応募済みのため）
  }

  // 応募一覧を再取得するヘルパー関数
  const refreshApplications = async () => {
    try {
      const res = await fetch("/api/applications/me")
      if (res.ok) {
        const data = await res.json()
        setApplications(data)
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error)
    }
  }

  // 応募を取り消す
  const handleCancelApplication = async (applicationId: string) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "応募取消し" }),
      })

      if (!res.ok) {
        const errorData = await res.json()

        // ステータスが「応募済み」以外の場合（400エラー）
        // 最新データに更新して、ユーザーに状況を伝える
        if (res.status === 400) {
          await refreshApplications()
          toast({
            title: "取り消しできません",
            description: errorData.error || "この応募はすでにステータスが変更されています。最新の状態に更新しました。",
            variant: "destructive",
          })
          return // throwせずに終了（リストは更新済み）
        }

        throw new Error(errorData.error || "応募の取り消しに失敗しました")
      }

      // 成功時：応募一覧を再取得
      await refreshApplications()

      // 成功トースト表示
      toast({
        title: "応募を取り消しました",
        description: "この案件への応募を取り消しました。",
      })
    } catch (error) {
      console.error("応募取り消しエラー:", error)
      toast({
        title: "エラー",
        description: "応募の取り消しに失敗しました。もう一度お試しください。",
        variant: "destructive",
      })
      throw error
    }
  }

  // 案件一覧ページへ遷移するための検索ハンドラー（ダミー）
  const handleSearch = (filters: JobFilters) => {
    // 検索ボタンが押されたら案件一覧ページに遷移
    const params = new URLSearchParams()
    if (filters.query) params.set("query", filters.query)
    if (filters.remote.length > 0) params.set("remote", filters.remote.join(","))
    if (filters.positions.length > 0) params.set("positions", filters.positions.join(","))
    if (filters.location) params.set("location", filters.location)
    if (filters.nearestStation) params.set("nearestStation", filters.nearestStation)
    
    window.location.href = `/?${params.toString()}`
  }

  // 応募済み案件が0件の場合の表示
  if (!loading && applications.length === 0) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
        <Header user={user} />

        {/* 水色背景エリア（ヘッダー下から検索ボックスのボタンまで） */}
        <div 
          className="mx-auto"
          style={{ maxWidth: "1400px", backgroundColor: "#d5e5f0" }}
        >
          {/* メッセージエリア（水色背景と同じ） */}
          <div 
            className="w-full py-10 px-6"
            style={{ backgroundColor: "#d5e5f0" }}
          >
            <div className="text-center">
              {/* チェックボックスアイコン（大きく、薄い水色） */}
              <div className="mb-4">
                <FontAwesomeIcon 
                  icon={faSquareCheck} 
                  style={{ 
                    color: "var(--pw-bg-light-blue)",
                    width: "64px",
                    height: "64px",
                  }}
                />
              </div>
              <h1
                style={{
                  fontSize: "24px",
                  color: "var(--pw-text-navy)",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                現在、応募済みの案件はありません。
              </h1>
              <p
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: "var(--pw-text-navy)",
                }}
              >
                気になる案件を探して、応募してみましょう！
              </p>
            </div>
          </div>

          {/* メッセージエリアと検索ボックスの間の線 */}
          <div 
            className="h-px"
            style={{ backgroundColor: "#9ab6ca" }}
          />

          {/* 検索ボックス - 案件一覧と同じスタイル */}
          <div className="px-6">
            <DashboardFilters onSearch={handleSearch} currentSort="recommend" />
          </div>
        </div>

        {/* AIおすすめ案件セクション（案件一覧と同じ薄水色背景） */}
        <div 
          className="min-h-screen mx-auto"
          style={{ 
            backgroundColor: "var(--pw-bg-body)",
            maxWidth: "1400px"
          }}
        >
          <div 
            className="px-6 pb-12 pt-12"
          >
            <h2
              className="text-center mb-8"
              style={{
                fontSize: "20px",
                color: "var(--pw-text-navy)",
                fontWeight: 700,
              }}
            >
              AIがあなたにおすすめする案件
            </h2>

            {aiMatchedJobsLoading ? (
              <div className="text-center py-12">
                <p style={{ color: "var(--pw-text-gray)" }}>おすすめ案件を読み込み中...</p>
              </div>
            ) : aiMatchedJobs.length > 0 ? (
              <AiRecommendedJobsCarousel jobs={aiMatchedJobs} onViewDetail={handleViewDetail} />
            ) : (
              <div className="text-center py-8">
                <p style={{ color: "var(--pw-text-gray)" }}>
                  現在、AIおすすめ案件はありません
                </p>
              </div>
            )}
          </div>
        </div>

        <JobDetailModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
          onApply={handleApply}
          appliedJobIds={appliedJobIds}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--pw-bg-light)" }}>
      <Header user={user} />

      <FullWidthLayout>
        {/* ヘッダー部分 */}
        <div className="mb-6">
          <div className="flex items-center gap-8 flex-wrap">
            {/* 件数表示 */}
            <div className="flex items-center gap-1">
              <span
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: filterBlue,
                  fontWeight: 400,
                }}
              >
                全
              </span>
              <span
                style={{
                  fontSize: "var(--pw-text-xl)",
                  color: filterBlue,
                  fontWeight: 700,
                }}
              >
                {filteredApplications.length}
              </span>
              <span
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: filterBlue,
                  fontWeight: 400,
                }}
              >
                件
              </span>
            </div>

            {/* ステータスフィルター */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                style={{
                  fontSize: "var(--pw-text-sm)",
                  color: filterBlue,
                  fontWeight: 500,
                }}
              >
                状態：
              </span>
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className="px-4 py-1.5 transition-colors"
                  style={{
                    fontSize: "var(--pw-text-sm)",
                    fontWeight: activeFilter === filter.id ? 600 : 400,
                    backgroundColor: activeFilter === filter.id ? filterBlue : "transparent",
                    color: activeFilter === filter.id ? "#ffffff" : filterBlue,
                    border: activeFilter === filter.id ? `1px solid ${filterBlue}` : "none",
                    borderRadius: activeFilter === filter.id ? "4px" : "0",
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        {loading ? (
          <div className="text-center py-12">
            <p style={{ color: "var(--pw-text-gray)" }}>読み込み中...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          // フィルター適用後に0件の場合
          <div
            className="text-center py-12 rounded-lg"
            style={{ backgroundColor: "#ffffff", border: "1px solid var(--pw-border-light)" }}
          >
            <p
              style={{
                fontSize: "var(--pw-text-lg)",
                color: "var(--pw-text-navy)",
                fontWeight: 600,
              }}
            >
              {`${STATUS_FILTERS.find((f) => f.id === activeFilter)?.label || ""}の案件はありません`}
            </p>
            <p
              className="mt-2"
              style={{
                fontSize: "var(--pw-text-sm)",
                color: "var(--pw-text-gray)",
              }}
            >
              気になる案件を探して、応募してみましょう！
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((app) => {
              if (!app.job) return null

              // 応募ステータスを案件に設定（募集ステータスも明示的に設定）
              const jobWithStatus: Job = {
                ...app.job,
                applicationStatus: app.status,
                recruitmentStatus: app.job.recruitmentStatus, // 明示的に設定
              }

              // 応募終了かどうか（応募ステータスが「見送り」または案件の募集ステータスが「クローズ」）
              const isEnded = app.status === "見送り" || app.job.recruitmentStatus === "クローズ"

              return (
                <JobCard
                  key={app.id}
                  job={jobWithStatus}
                  onViewDetail={isEnded ? () => {} : handleViewDetail}
                  showApplicationStatus={true}
                  isEnded={isEnded}
                  onCancelApplication={handleCancelApplication}
                  applicationId={app.id}
                />
              )
            })}
          </div>
        )}
      </FullWidthLayout>

      <JobDetailModal
        jobId={selectedJobId}
        onClose={() => setSelectedJobId(null)}
        onApply={handleApply}
        appliedJobIds={appliedJobIds}
      />
    </div>
  )
}

