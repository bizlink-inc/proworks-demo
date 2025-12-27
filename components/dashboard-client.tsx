"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { FullWidthLayout } from "@/components/layouts"
import { DashboardFilters, type JobFilters } from "@/components/dashboard-filters"
import { JobCard } from "@/components/job-card"
import { JobDetailModal } from "@/components/job-detail-modal"
import { ApplySuccessModal } from "@/components/apply-success-modal"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { useToast } from "@/hooks/use-toast"
import { useApplicationStatusMonitor } from "@/hooks/use-application-status-monitor"
import { useWithdrawalCheck } from "@/hooks/use-withdrawal-check"
import { usePrefetch, usePrefetchNextPage } from "@/hooks/use-prefetch"
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
  // SSRで事前取得した案件データ（初期表示高速化用）
  initialJobs?: Job[]
  initialTotal?: number
  initialTotalAll?: number
}

export const DashboardClient = ({ user, initialJobs = [], initialTotal = 0, initialTotalAll = 0 }: DashboardClientProps) => {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  useApplicationStatusMonitor()
  const { handleWithdrawalError } = useWithdrawalCheck()

  // 他ページ（/me, /applications）をバックグラウンドで先読み
  usePrefetch()

  // SSRでデータ取得済みの場合は即座に表示
  const hasInitialData = initialJobs.length > 0
  const size = 21 // 3列×7行

  // サーバーサイドページネーション：現在ページのデータのみ保持
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [total, setTotal] = useState(initialTotal)
  const [totalAll, setTotalAll] = useState(initialTotalAll)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  // APIから取得するかどうかのフラグ（SSRデータありなら初回はスキップ）
  const [needsFetch, setNeedsFetch] = useState(!hasInitialData)
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

  // URLパラメータからjobIdを取得してモーダルを開く
  useEffect(() => {
    const jobIdParam = searchParams.get("jobId")
    if (jobIdParam) {
      setSelectedJobId(jobIdParam)
    }
  }, [searchParams])

  // 初回ロード時に退会チェック
  useEffect(() => {
    const checkWithdrawal = async () => {
      try {
        const res = await fetch("/api/me")
        if (!res.ok) {
          await handleWithdrawalError(res)
        }
      } catch (error) {
        console.error("退会チェックエラー:", error)
      }
    }
    checkWithdrawal()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const totalPages = Math.ceil(total / size)

  // 次ページのデータを先読み（ページ変更をスムーズに）
  const buildNextPageUrl = useCallback((pageNum: number) => {
    const params = new URLSearchParams({
      query: filters.query,
      sort: filters.sort,
      skip: String((pageNum - 1) * size),
      limit: String(size),
    })
    if (filters.remote.length > 0) params.set("remote", filters.remote.join(","))
    if (filters.positions.length > 0) params.set("positions", filters.positions.join(","))
    if (filters.location) params.set("location", filters.location)
    if (filters.nearestStation) params.set("nearestStation", filters.nearestStation)
    return `/api/jobs?${params}`
  }, [filters, size])
  usePrefetchNextPage(page, totalPages, buildNextPageUrl)

  // 初回マウント時：SSRデータがない場合のみAPIから取得
  useEffect(() => {
    if (needsFetch) {
      fetchJobs()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // フィルター変更時はAPIから取得
  const filtersRef = useRef(filters)
  useEffect(() => {
    // 初回マウント時はスキップ（上のuseEffectで処理）
    if (filtersRef.current === filters) return
    filtersRef.current = filters
    setNeedsFetch(true)
    fetchJobs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // ページ変更時の処理（サーバーサイドページネーション）
  const pageRef = useRef(page)
  useEffect(() => {
    // 初回マウント時（page=1）はSSRデータを使用するのでスキップ
    if (page === 1 && pageRef.current === 1 && hasInitialData) {
      pageRef.current = page
      return
    }
    pageRef.current = page
    fetchPage(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // 共通のクエリパラメータを構築
  const buildParams = (pageNum: number) => {
    const params = new URLSearchParams({
      query: filters.query,
      sort: filters.sort,
      skip: String((pageNum - 1) * size),
      limit: String(size),
    })

    if (filters.remote.length > 0) {
      params.set("remote", filters.remote.join(","))
    }
    if (filters.positions.length > 0) {
      params.set("positions", filters.positions.join(","))
    }
    if (filters.location) {
      params.set("location", filters.location)
    }
    if (filters.nearestStation) {
      params.set("nearestStation", filters.nearestStation)
    }

    return params
  }

  // フィルター変更時の取得（ページ1にリセット）
  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const params = buildParams(1)
      const res = await fetch(`/api/jobs?${params}`)
      const data = await res.json()
      setJobs(data.items)
      setTotal(data.total)
      setTotalAll(data.totalAll)
    } finally {
      setIsLoading(false)
    }
  }

  // ページ変更時の取得
  const fetchPage = async (pageNum: number) => {
    setIsLoading(true)
    try {
      const params = buildParams(pageNum)
      const res = await fetch(`/api/jobs?${params}`)
      const data = await res.json()
      setJobs(data.items)
      setTotal(data.total)
      setTotalAll(data.totalAll)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (newFilters: JobFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleApply = async (jobId: string, jobTitle: string) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      })

      if (res.status === 409) {
        toast({
          title: "既に応募済みです",
          description: "この案件には既に応募しています。",
          variant: "destructive",
        })
        return
      }

      if (!res.ok) {
        throw new Error("Failed to apply")
      }

      const application = await res.json()

      // APIレスポンスから直接 missingFields を取得（パフォーマンス改善）
      setSelectedJobId(null)
      setApplySuccess({
        jobTitle,
        appliedAt: application.appliedAt,
        missingFields: application.missingFields,
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
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      <Header user={user} />

      {/* お知らせバナー - ヘッダーの直下に配置 */}
      <AnnouncementBanner />

      {/* 検索ボックス - お知らせバナーの下に配置（FullWidthLayoutの外） */}
      <div 
        className="mx-auto px-6"
        style={{ maxWidth: "1400px", backgroundColor: "#d5e5f0" }}
      >
        <DashboardFilters onSearch={handleSearch} currentSort={filters.sort} />
      </div>

      <FullWidthLayout>

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
              <span style={{ fontSize: "var(--pw-text-xl)" }}>{total}</span>件/全{totalAll}件
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

        {total === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 mb-8"
            style={{ color: "var(--pw-text-primary)" }}
          >
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--pw-text-navy)" }}
            >
              検索結果は見つかりませんでした。
            </p>
            <p className="text-sm text-center">
              別のキーワードで試してください。検索ワードを短くするか、絞り込み条件を外すとヒットしやすくなります。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onViewDetail={setSelectedJobId} />
            ))}
          </div>
        )}

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
              <span style={{ fontSize: "var(--pw-text-xl)" }}>{total}</span>件/全{totalAll}件
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
