"use client"

import { useState, useEffect, useMemo } from "react"
import { Header } from "@/components/header"
import { FullWidthLayout } from "@/components/layouts"
import { JobCard } from "@/components/job-card"
import { JobDetailModal } from "@/components/job-detail-modal"
import { useApplicationStatusMonitor } from "@/hooks/use-application-status-monitor"
import type { Job } from "@/lib/kintone/types"

interface ApplicationsClientProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
}

// ステータスフィルターの定義（kintoneの値をそのまま使用）
type StatusFilter = "all" | "応募済み" | "面談調整中" | "面談予定" | "案件参画" | "見送り"

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "すべて" },
  { id: "案件参画", label: "案件参画" },
  { id: "面談調整中", label: "面談調整中" },
  { id: "面談予定", label: "面談予定" },
  { id: "応募済み", label: "応募済み" },
  { id: "見送り", label: "見送り" },
]

// フィルター用の青色
const filterBlue = "#3966a2"

// ステータスの表示順序（ポジティブ→ネガティブ）
const STATUS_PRIORITY: Record<string, number> = {
  "案件参画": 1,
  "面談調整中": 2,
  "面談予定": 3,
  "応募済み": 4,
  "見送り": 5,
}

// ステータスの優先度を取得
const getStatusPriority = (status: string | null | undefined): number => {
  return STATUS_PRIORITY[status || "応募済み"] || 99
}

export const ApplicationsClient = ({ user }: ApplicationsClientProps) => {
  useApplicationStatusMonitor()

  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

  // フィルタリングとソートされた応募一覧
  const filteredApplications = useMemo(() => {
    let filtered = applications
    
    // フィルター適用
    if (activeFilter !== "all") {
      filtered = applications.filter((app) => app.status === activeFilter)
    }
    
    // ステータスの優先度でソート（ポジティブ→ネガティブ順）
    return [...filtered].sort((a, b) => {
      const priorityA = getStatusPriority(a.status)
      const priorityB = getStatusPriority(b.status)
      return priorityA - priorityB
    })
  }, [applications, activeFilter])

  // 応募詳細を見る
  const handleViewDetail = (jobId: string) => {
    setSelectedJobId(jobId)
  }

  // 応募詳細モーダルを閉じる（応募機能は使わない）
  const handleApply = () => {
    // 何もしない（既に応募済みのため）
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
              {activeFilter === "all"
                ? "応募済みの案件はありません"
                : `${STATUS_FILTERS.find((f) => f.id === activeFilter)?.label}の案件はありません`}
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

              // 応募ステータスを案件に設定
              const jobWithStatus: Job = {
                ...app.job,
                applicationStatus: app.status,
              }

              // 応募終了かどうか
              const isEnded = app.status === "見送り"

              return (
                <JobCard
                  key={app.id}
                  job={jobWithStatus}
                  onViewDetail={isEnded ? () => {} : handleViewDetail}
                  showApplicationStatus={true}
                  isEnded={isEnded}
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
