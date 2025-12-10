"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { FullWidthLayout } from "@/components/layouts"
import { DashboardFilters, type JobFilters } from "@/components/dashboard-filters"
import { JobCard } from "@/components/job-card"
import { JobDetailModal } from "@/components/job-detail-modal"
import { ApplySuccessModal } from "@/components/apply-success-modal"
import { useToast } from "@/hooks/use-toast"
import { useApplicationStatusMonitor } from "@/hooks/use-application-status-monitor"
import { ChevronDown } from "lucide-react"
import type { Job } from "@/lib/kintone/types"

// ソート選択肢の定義
const SORT_OPTIONS = [
  { value: "recommend", label: "おすすめ順" },
  { value: "new", label: "新着順" },
  { value: "price", label: "金額高い順" },
] as const

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
    sort: "recommend", // デフォルトをおすすめ順に変更
    remote: [],
    positions: [],
    location: "",
    nearestStation: "",
  })
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<{
    jobTitle: string
    appliedAt: string
    missingFields?: string[]
  } | null>(null)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const sortDropdownRef = useRef<HTMLDivElement>(null)

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

      // 応募成功後、ユーザー情報を取得して必須項目をチェック
      let missingFields: string[] = []
      try {
        const userRes = await fetch("/api/me")
        if (userRes.ok) {
          const { checkRequiredFields } = await import("@/lib/utils/profile-validation")
          const userData = await userRes.json()
          missingFields = checkRequiredFields(userData)
        }
      } catch (error) {
        console.error("ユーザー情報の取得に失敗:", error)
        // エラーが発生しても応募成功モーダルは表示する
      }

      setSelectedJobId(null)
      setApplySuccess({
        jobTitle,
        appliedAt: application.appliedAt,
        missingFields: missingFields.length > 0 ? missingFields : undefined,
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

        {/* ページネーション・表示順 - 同じ行に配置（下に寄せる） */}
        <div className="flex items-center justify-between mb-2 mt-8">
          {/* 左側: 検索結果件数 + ページネーション */}
          <div className="flex items-center gap-2">
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

          {/* 右側: 表示順プルダウン */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="flex items-center gap-1 cursor-pointer"
            >
              <span
                style={{
                  fontSize: "var(--pw-text-sm)",
                  color: "#2c4a6b", // 濃い紺色
                }}
              >
                表示順:
              </span>
              <span
                style={{
                  fontSize: "var(--pw-text-sm)",
                  color: "#5a8bb5", // 案件タイトルの色（薄い青）
                }}
              >
                {SORT_OPTIONS.find(opt => opt.value === filters.sort)?.label || "おすすめ順"}
              </span>
              <ChevronDown 
                className="w-4 h-4" 
                style={{ color: "#5a8bb5" }}
              />
            </button>
            
            {/* ドロップダウンメニュー（下側に表示） */}
            {sortDropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-50 min-w-[140px]"
                style={{
                  borderColor: "#e0e0e0",
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFilters({ ...filters, sort: option.value })
                      setPage(1)
                      setSortDropdownOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors first:rounded-t-md last:rounded-b-md"
                    style={{
                      fontSize: "var(--pw-text-sm)",
                      color: filters.sort === option.value ? "#5a8bb5" : "#333",
                      fontWeight: filters.sort === option.value ? 600 : 400,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
          missingFields={applySuccess.missingFields}
          onClose={() => setApplySuccess(null)}
        />
      )}
    </div>
  )
}
