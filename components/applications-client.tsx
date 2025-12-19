"use client"

import { useState, useEffect, useMemo } from "react"
import { Header } from "@/components/header"
import { FullWidthLayout } from "@/components/layouts"
import { JobCard } from "@/components/job-card"
import { JobDetailModal } from "@/components/job-detail-modal"
import { JobCarousel } from "@/components/job-carousel"
import { useApplicationStatusMonitor } from "@/hooks/use-application-status-monitor"
import type { Job } from "@/lib/kintone/types"
import { mapApplicationStatusToDisplay } from "@/lib/utils"

interface ApplicationsClientProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
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

export const ApplicationsClient = ({ user }: ApplicationsClientProps) => {
  useApplicationStatusMonitor()

  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [recommendedJobsLoading, setRecommendedJobsLoading] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all")

  // 応募済み案件を取得
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/applications/me")
        if (res.ok) {
          const data = await res.json()
          setApplications(data)
        }
      } catch (error) {
        console.error("Failed to fetch applications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  // おすすめ案件を取得（応募済み案件が0件の場合のみ）
  useEffect(() => {
    const fetchRecommendedJobs = async () => {
      if (applications.length > 0 || loading) return

      try {
        setRecommendedJobsLoading(true)
        const res = await fetch("/api/recommended-jobs")
        if (res.ok) {
          const data = await res.json()
          setRecommendedJobs(data.items || [])
        }
      } catch (error) {
        console.error("Failed to fetch recommended jobs:", error)
      } finally {
        setRecommendedJobsLoading(false)
      }
    }

    fetchRecommendedJobs()
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
        const error = await res.json()
        throw new Error(error.error || "応募の取り消しに失敗しました")
      }

      // 応募一覧を再取得
      const fetchApplications = async () => {
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

      await fetchApplications()
    } catch (error) {
      console.error("応募取り消しエラー:", error)
      throw error
    }
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
          // 応募済み案件が0件の場合、おすすめ案件をカルーセルで表示
          activeFilter === "all" && applications.length === 0 ? (
            <div
              className="py-12 rounded-lg"
              style={{ backgroundColor: "#ffffff", border: "1px solid var(--pw-border-light)" }}
            >
              {/* メッセージ表示 */}
              <div className="text-center mb-8">
                <p
                  style={{
                    fontSize: "var(--pw-text-lg)",
                    color: "var(--pw-text-navy)",
                    fontWeight: 600,
                  }}
                >
                  応募済みの案件はありません
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

              {/* おすすめ案件カルーセル */}
              {recommendedJobsLoading ? (
                <div className="text-center py-12">
                  <p style={{ color: "var(--pw-text-gray)" }}>おすすめ案件を読み込み中...</p>
                </div>
              ) : recommendedJobs.length > 0 ? (
                <div className="px-4">
                  <h2
                    className="mb-6 text-center"
                    style={{
                      fontSize: "var(--pw-text-xl)",
                      color: "var(--pw-text-navy)",
                      fontWeight: 700,
                    }}
                  >
                    おすすめ案件
                  </h2>
                  <JobCarousel jobs={recommendedJobs} onViewDetail={handleViewDetail} />
                </div>
              ) : null}
            </div>
          ) : (
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
          )
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
      />
    </div>
  )
}

