"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { FullWidthLayout } from "@/components/layouts"
import { DashboardFilters, type JobFilters } from "@/components/dashboard-filters"
import { JobCard } from "@/components/job-card"
import { JobDetailModal } from "@/components/job-detail-modal"
import { ApplySuccessModal } from "@/components/apply-success-modal"
import { useToast } from "@/hooks/use-toast"
import { useApplicationStatusMonitor } from "@/hooks/use-application-status-monitor"
import type { Job } from "@/lib/kintone/types"

interface DashboardClientProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
}

export const DashboardClient = ({ user }: DashboardClientProps) => {
  const { toast } = useToast()
  useApplicationStatusMonitor()

  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<JobFilters>({ 
    query: "", 
    sort: "new",
    remote: [],
    positions: [],
    location: "",
    nearestStation: "",
  })
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<{
    jobTitle: string
    appliedAt: string
  } | null>(null)

  const size = 21 // 3列×7行
  const totalPages = Math.ceil(total / size)

  useEffect(() => {
    fetchJobs()
  }, [page, filters])

  const fetchJobs = async () => {
    const params = new URLSearchParams({
      query: filters.query,
      sort: filters.sort,
    })
    
    // リモートフィルター（複数選択可）
    if (filters.remote.length > 0) {
      params.set("remote", filters.remote.join(","))
    }
    
    // 職種フィルター（複数選択可）
    if (filters.positions.length > 0) {
      params.set("positions", filters.positions.join(","))
    }
    
    // 勤務地エリアフィルター
    if (filters.location) {
      params.set("location", filters.location)
    }
    
    // 最寄駅フィルター
    if (filters.nearestStation) {
      params.set("nearestStation", filters.nearestStation)
    }

    const res = await fetch(`/api/jobs?${params}`)
    const data = await res.json()
    
    // ページネーション処理（クライアント側で実施）
    const startIndex = (page - 1) * size
    const endIndex = startIndex + size
    setJobs(data.items.slice(startIndex, endIndex))
    setTotal(data.total)
  }

  const handleSearch = (newFilters: JobFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleApply = async (jobId: string, jobTitle: string) => {
    console.log("[v0] 応募処理開始:", { jobId, jobTitle })

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })

      console.log("[v0] 応募APIレスポンス:", { status: res.status, ok: res.ok })

      if (res.status === 409) {
        toast({
          title: "既に応募済みです",
          description: "この案件には既に応募しています。",
          variant: "destructive",
        })
        return
      }

      if (!res.ok) {
        const errorText = await res.text()
        console.log("[v0] 応募エラー:", errorText)
        throw new Error("Failed to apply")
      }

      const application = await res.json()
      console.log("[v0] 応募成功:", application)

      setSelectedJobId(null)
      setApplySuccess({
        jobTitle,
        appliedAt: application.appliedAt,
      })
    } catch (error) {
      console.error("[v0] 応募処理エラー:", error)
      toast({
        title: "エラー",
        description: "応募に失敗しました。",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen">
      <Header user={user} />

      <FullWidthLayout>
        <DashboardFilters onSearch={handleSearch} currentSort={filters.sort} />

        {/* ページネーション - 上部 */}
        <div className="flex items-center gap-2 mb-6">
          <span
            style={{
              fontSize: "var(--pw-text-sm)",
              color: "var(--pw-text-primary)",
              fontWeight: 600
            }}
          >
            検索結果 <span style={{ fontSize: "var(--pw-text-xl)" }}>{total}</span>件
          </span>
          
          {totalPages > 1 && (
            <>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="flex items-center justify-center transition-colors"
                  style={{
                    minWidth: "28px",
                    height: "28px",
                    padding: "0 6px",
                    borderRadius: "4px",
                    backgroundColor: p === page ? "#5a8bb5" : "transparent",
                    color: p === page ? "#ffffff" : "#5a8bb5",
                    fontSize: "var(--pw-text-sm)",
                    fontWeight: 600
                  }}
                >
                  {p}
                </button>
              ))}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onViewDetail={setSelectedJobId} />
          ))}
        </div>

        {/* ページネーション - 下部 */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 justify-start">
            <span
              style={{
                fontSize: "var(--pw-text-sm)",
                color: "var(--pw-text-primary)",
                fontWeight: 600
              }}
            >
              検索結果 <span style={{ fontSize: "var(--pw-text-xl)" }}>{total}</span>件
            </span>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="flex items-center justify-center transition-colors"
                style={{
                  minWidth: "28px",
                  height: "28px",
                  padding: "0 6px",
                  borderRadius: "4px",
                  backgroundColor: p === page ? "#5a8bb5" : "transparent",
                  color: p === page ? "#ffffff" : "#5a8bb5",
                  fontSize: "var(--pw-text-sm)",
                  fontWeight: 600
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </FullWidthLayout>

      <JobDetailModal jobId={selectedJobId} onClose={() => setSelectedJobId(null)} onApply={handleApply} />

      {applySuccess && (
        <ApplySuccessModal
          isOpen={true}
          jobTitle={applySuccess.jobTitle}
          appliedAt={applySuccess.appliedAt}
          onClose={() => setApplySuccess(null)}
        />
      )}
    </div>
  )
}
