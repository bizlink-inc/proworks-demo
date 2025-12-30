"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { FullWidthLayout, SidebarLayout } from "@/components/layouts"
import { DashboardFilters, type JobFilters } from "@/components/dashboard-filters"
import { JobCard } from "@/components/job-card"
import { JobDetailModal } from "@/components/job-detail-modal"
import { ApplySuccessModal } from "@/components/apply-success-modal"
import { AnnouncementBanner } from "@/components/announcement-banner"
import { AiRecommendedJobsCarousel } from "@/components/ai-recommended-jobs-carousel"
import { ProfileForm } from "@/components/profile-form"
import { WorkHistoryForm } from "@/components/work-history-form"
import { PreferencesForm } from "@/components/preferences-form"
import { SettingsForm } from "@/components/settings-form"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useApplicationStatusMonitor } from "@/hooks/use-application-status-monitor"
import { useWithdrawalCheck } from "@/hooks/use-withdrawal-check"
import { ChevronDown } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSquareCheck } from "@fortawesome/free-regular-svg-icons"
import type { Job, Talent } from "@/lib/kintone/types"

// タブの定義
type TabType = "jobs" | "applications" | "profile"

// ソート選択肢
const SORT_OPTIONS = [
  { value: "recommend", label: "おすすめ順" },
  { value: "new", label: "新着順" },
  { value: "price", label: "金額高い順" },
] as const

// ステータスフィルター
type StatusFilter = "all" | "応募済み" | "面談調整中" | "面談予定" | "案件参画" | "見送り"
const STATUS_FILTERS: { id: StatusFilter; kintoneValues: string[]; label: string }[] = [
  { id: "all", kintoneValues: ["all"], label: "すべて" },
  { id: "案件参画", kintoneValues: ["案件参画"], label: "案件決定" },
  { id: "面談調整中", kintoneValues: ["面談調整中"], label: "面談調整中" },
  { id: "面談予定", kintoneValues: ["予定決定", "面談予定"], label: "面談確定" },
  { id: "応募済み", kintoneValues: ["応募済み"], label: "応募済み" },
  { id: "見送り", kintoneValues: ["見送り"], label: "募集終了" },
]

// マイページメニュー
type ProfileMenuItem = "profile" | "work-history" | "preferences" | "settings"
const PROFILE_MENU_ITEMS: { id: ProfileMenuItem; label: string }[] = [
  { id: "profile", label: "プロフィール" },
  { id: "work-history", label: "職歴・資格" },
  { id: "preferences", label: "希望条件" },
  { id: "settings", label: "登録情報" },
]

interface UnifiedDashboardProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
  // SSRで事前取得した案件データ
  initialJobs?: Job[]
  initialTotal?: number
  initialTotalAll?: number
}

export function UnifiedDashboard({
  user,
  initialJobs = [],
  initialTotal = 0,
  initialTotalAll = 0,
}: UnifiedDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { handleWithdrawalError } = useWithdrawalCheck()

  // タブ状態（URLから直接取得 - シングルソースオブトゥルース）
  const activeTab: TabType = (searchParams.get("tab") as TabType) || "jobs"

  // === 案件一覧の状態 ===
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [total, setTotal] = useState(initialTotal)
  const [totalAll, setTotalAll] = useState(initialTotalAll)
  const [page, setPage] = useState(1)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [filters, setFilters] = useState<JobFilters>({
    query: "",
    sort: "recommend",
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
  const size = 21

  // === 応募済み案件の状態 ===
  const [applications, setApplications] = useState<any[] | null>(null)
  const [isLoadingApplications, setIsLoadingApplications] = useState(false)
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>("all")
  const [aiMatchedJobs, setAiMatchedJobs] = useState<Job[]>([])

  // === マイページの状態 ===
  const [talent, setTalent] = useState<Talent | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [activeProfileMenu, setActiveProfileMenu] = useState<ProfileMenuItem>("profile")

  // ステータス監視
  useApplicationStatusMonitor(applications || [])

  // タブ変更時のURL更新（router.pushのみ - stateは更新しない）
  const handleTabChange = useCallback((tab: TabType) => {
    if (tab === "jobs") {
      router.push("/", { scroll: false })
    } else {
      router.push(`/?tab=${tab}`, { scroll: false })
    }
  }, [router])

  // 初回ロード時の退会チェック
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

  // === 応募データの取得 ===
  const fetchApplications = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingApplications(true)
    try {
      const res = await fetch("/api/applications/me")
      if (res.ok) {
        const data = await res.json()
        setApplications(data)
      }
    } catch (error) {
      console.error("応募データ取得エラー:", error)
    } finally {
      setIsLoadingApplications(false)
    }
  }, [])

  // === マイページデータの取得 ===
  const fetchProfile = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoadingProfile(true)
    try {
      const res = await fetch("/api/me")
      if (res.ok) {
        const data = await res.json()
        setTalent(data)
      } else if (res.status === 404) {
        // 新規ユーザー
        const emptyUser: Talent = {
          id: "",
          authUserId: user.id || "",
          lastName: "",
          firstName: "",
          fullName: "",
          lastNameKana: "",
          firstNameKana: "",
          email: user.email || "",
          birthDate: "",
          postalCode: "",
          address: "",
          phone: "",
          skills: "",
          experience: "",
          resumeFiles: [],
          portfolioUrl: "",
          availableFrom: "",
          desiredRate: "",
          desiredWorkDays: "",
          desiredCommute: "",
          desiredWorkStyle: [],
          desiredWorkHours: "",
          desiredWork: "",
          ngCompanies: "",
          otherRequests: "",
        }
        setTalent(emptyUser)
      }
    } catch (error) {
      console.error("プロフィール取得エラー:", error)
    } finally {
      setIsLoadingProfile(false)
    }
  }, [user.id, user.email])

  // タブごとの初回フェッチを追跡するref
  const hasFetchedApplications = useRef(false)
  const hasFetchedProfile = useRef(false)

  // タブ切り替え時のデータ取得
  useEffect(() => {
    if (activeTab === "applications") {
      if (!hasFetchedApplications.current) {
        // 初回は読み込み表示付きで取得
        hasFetchedApplications.current = true
        fetchApplications(true)
      }
    } else if (activeTab === "profile") {
      if (!hasFetchedProfile.current) {
        // 初回は読み込み表示付きで取得
        hasFetchedProfile.current = true
        fetchProfile(true)
      }
    }
  }, [activeTab, fetchApplications, fetchProfile])

  // === 案件一覧のロジック ===
  const totalPages = Math.ceil(total / size)

  const buildParams = (pageNum: number) => {
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
    return params
  }

  const fetchJobs = async () => {
    setIsLoadingJobs(true)
    try {
      const params = buildParams(1)
      const res = await fetch(`/api/jobs?${params}`)
      const data = await res.json()
      setJobs(data.items)
      setTotal(data.total)
      setTotalAll(data.totalAll)
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const fetchPage = async (pageNum: number) => {
    setIsLoadingJobs(true)
    try {
      const params = buildParams(pageNum)
      const res = await fetch(`/api/jobs?${params}`)
      const data = await res.json()
      setJobs(data.items)
      setTotal(data.total)
      setTotalAll(data.totalAll)
    } finally {
      setIsLoadingJobs(false)
    }
  }

  // フィルター変更時
  const filtersRef = useRef(filters)
  useEffect(() => {
    if (filtersRef.current === filters) return
    filtersRef.current = filters
    fetchJobs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // ページ変更時
  const pageRef = useRef(page)
  useEffect(() => {
    if (page === 1 && pageRef.current === 1 && initialJobs.length > 0) {
      pageRef.current = page
      return
    }
    pageRef.current = page
    fetchPage(page)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

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

      if (!res.ok) throw new Error("Failed to apply")

      const application = await res.json()
      setSelectedJobId(null)
      setApplySuccess({
        jobTitle,
        appliedAt: application.appliedAt,
        missingFields: application.missingFields,
      })

      // 応募後はapplicationsを再取得するためフラグをリセット
      setApplications(null)
      hasFetchedApplications.current = false
    } catch (error) {
      console.error("応募処理エラー:", error)
      toast({
        title: "エラー",
        description: "応募に失敗しました。",
        variant: "destructive",
      })
    }
  }

  // === 応募済み案件のロジック ===
  const getStatusPriority = (status: string, recruitmentStatus?: string): number => {
    if (status === "見送り" || recruitmentStatus === "クローズ") return 5
    switch (status) {
      case "案件参画": return 1
      case "予定決定":
      case "面談予定": return 2
      case "面談調整中": return 3
      case "応募済み": return 4
      default: return 6
    }
  }

  const filteredApplications = (applications || []).filter((app) => {
    if (activeStatusFilter === "all") return true
    const filterConfig = STATUS_FILTERS.find((f) => f.id === activeStatusFilter)
    return filterConfig?.kintoneValues.includes(app.status)
  }).sort((a, b) => {
    const priorityA = getStatusPriority(a.status, a.job?.recruitmentStatus)
    const priorityB = getStatusPriority(b.status, b.job?.recruitmentStatus)
    if (priorityA !== priorityB) return priorityA - priorityB
    const dateA = new Date(a.appliedAt || 0).getTime()
    const dateB = new Date(b.appliedAt || 0).getTime()
    return dateB - dateA
  })

  const handleCancelApplication = async (applicationId: string) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "応募取消し" }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        if (res.status === 400) {
          await fetchApplications(false)
          toast({
            title: "取り消しできません",
            description: errorData.error || "この応募はすでにステータスが変更されています。",
            variant: "destructive",
          })
          return
        }
        throw new Error(errorData.error || "応募の取り消しに失敗しました")
      }

      await fetchApplications(false)
      toast({
        title: "応募を取り消しました",
        description: "この案件への応募を取り消しました。",
      })
    } catch (error) {
      console.error("応募取り消しエラー:", error)
      toast({
        title: "エラー",
        description: "応募の取り消しに失敗しました。",
        variant: "destructive",
      })
      throw error
    }
  }

  // AIマッチ案件の取得（応募0件時）
  useEffect(() => {
    const fetchAiMatched = async () => {
      if ((applications || []).length > 0) return
      try {
        const res = await fetch("/api/recommended-jobs")
        if (res.ok) {
          const data = await res.json()
          const aiMatched = (data.items || []).filter((job: Job & { aiMatched?: boolean }) => job.aiMatched)
          setAiMatchedJobs(aiMatched)
        }
      } catch (error) {
        console.error("AIマッチ案件取得エラー:", error)
      }
    }
    if (activeTab === "applications" && applications !== null && applications.length === 0) {
      fetchAiMatched()
    }
  }, [activeTab, applications])

  // スケルトンカード
  const JobCardSkeleton = () => (
    <div className="rounded-lg p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #d5e5f0" }}>
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4 mb-4" />
      <div className="flex items-baseline gap-1 mb-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="border-t border-[#d5e5f0] my-4" />
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
      <div className="mt-5">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      <Header user={user} />

      {/* 案件一覧タブ */}
      {activeTab === "jobs" && (
        <>
          <AnnouncementBanner />
          <div
            className="mx-auto px-6"
            style={{ maxWidth: "1400px", backgroundColor: "#d5e5f0" }}
          >
            <DashboardFilters onSearch={handleSearch} currentSort={filters.sort} />
          </div>

          <FullWidthLayout>
            <div className="flex items-center justify-between mb-2 mt-8">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)", fontWeight: 600 }}>
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
                          fontWeight: 600,
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </>
                )}
              </div>

              <div className="relative" ref={sortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <span style={{ fontSize: "var(--pw-text-sm)", color: "#2c4a6b" }}>表示順:</span>
                  <span style={{ fontSize: "var(--pw-text-sm)", color: "#5a8bb5" }}>
                    {SORT_OPTIONS.find(opt => opt.value === filters.sort)?.label || "おすすめ順"}
                  </span>
                  <ChevronDown className="w-4 h-4" style={{ color: "#5a8bb5" }} />
                </button>
                {sortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-md shadow-lg z-50 min-w-[140px]" style={{ borderColor: "#e0e0e0" }}>
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
              <div className="flex flex-col items-center justify-center py-16 mb-8" style={{ color: "var(--pw-text-primary)" }}>
                <p className="text-lg font-semibold mb-2" style={{ color: "var(--pw-text-navy)" }}>
                  検索結果は見つかりませんでした。
                </p>
                <p className="text-sm text-center">
                  別のキーワードで試してください。
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} onViewDetail={setSelectedJobId} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center gap-2 justify-start">
                <span style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)", fontWeight: 600 }}>
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
                      fontWeight: 600,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </FullWidthLayout>
        </>
      )}

      {/* 応募済み案件タブ */}
      {activeTab === "applications" && (
        <>
          {isLoadingApplications && applications === null ? (
            <FullWidthLayout>
              <div className="mb-6">
                <div className="flex items-center gap-8 flex-wrap">
                  <Skeleton className="h-6 w-20" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-10" />
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-8 w-16" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <JobCardSkeleton />
                <JobCardSkeleton />
                <JobCardSkeleton />
              </div>
            </FullWidthLayout>
          ) : (applications || []).length === 0 ? (
            <>
              <div className="mx-auto" style={{ maxWidth: "1400px", backgroundColor: "#d5e5f0" }}>
                <div className="w-full py-10 px-6" style={{ backgroundColor: "#d5e5f0" }}>
                  <div className="text-center">
                    <div className="mb-4">
                      <FontAwesomeIcon
                        icon={faSquareCheck}
                        style={{ color: "var(--pw-bg-light-blue)", width: "64px", height: "64px" }}
                      />
                    </div>
                    <h1 style={{ fontSize: "24px", color: "var(--pw-text-navy)", fontWeight: 700, marginBottom: "8px" }}>
                      現在、応募済みの案件はありません。
                    </h1>
                    <p style={{ fontSize: "var(--pw-text-md)", color: "var(--pw-text-navy)" }}>
                      気になる案件を探して、応募してみましょう！
                    </p>
                  </div>
                </div>
                <div className="h-px" style={{ backgroundColor: "#9ab6ca" }} />
                <div className="px-6">
                  <DashboardFilters onSearch={(f) => { handleTabChange("jobs"); setFilters(f) }} currentSort="recommend" />
                </div>
              </div>
              <div className="min-h-screen mx-auto" style={{ backgroundColor: "var(--pw-bg-body)", maxWidth: "1400px" }}>
                <div className="px-6 pb-12 pt-12">
                  <h2 className="text-center mb-8" style={{ fontSize: "20px", color: "var(--pw-text-navy)", fontWeight: 700 }}>
                    AIがあなたにおすすめする案件
                  </h2>
                  {aiMatchedJobs.length > 0 ? (
                    <AiRecommendedJobsCarousel jobs={aiMatchedJobs} onViewDetail={setSelectedJobId} />
                  ) : (
                    <div className="text-center py-8">
                      <p style={{ color: "var(--pw-text-gray)" }}>現在、AIおすすめ案件はありません</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ backgroundColor: "var(--pw-bg-light)" }}>
              <FullWidthLayout>
                <div className="mb-6">
                  <div className="flex items-center gap-8 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: "var(--pw-text-md)", color: "#3966a2", fontWeight: 400 }}>全</span>
                      <span style={{ fontSize: "var(--pw-text-xl)", color: "#3966a2", fontWeight: 700 }}>{filteredApplications.length}</span>
                      <span style={{ fontSize: "var(--pw-text-md)", color: "#3966a2", fontWeight: 400 }}>件</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span style={{ fontSize: "var(--pw-text-sm)", color: "#3966a2", fontWeight: 500 }}>状態：</span>
                      {STATUS_FILTERS.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setActiveStatusFilter(filter.id)}
                          className="px-4 py-1.5 transition-colors"
                          style={{
                            fontSize: "var(--pw-text-sm)",
                            fontWeight: activeStatusFilter === filter.id ? 600 : 400,
                            backgroundColor: activeStatusFilter === filter.id ? "#3966a2" : "transparent",
                            color: activeStatusFilter === filter.id ? "#ffffff" : "#3966a2",
                            border: activeStatusFilter === filter.id ? "1px solid #3966a2" : "none",
                            borderRadius: activeStatusFilter === filter.id ? "4px" : "0",
                          }}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12 rounded-lg" style={{ backgroundColor: "#ffffff", border: "1px solid var(--pw-border-light)" }}>
                    <p style={{ fontSize: "var(--pw-text-lg)", color: "var(--pw-text-navy)", fontWeight: 600 }}>
                      {`${STATUS_FILTERS.find((f) => f.id === activeStatusFilter)?.label || ""}の案件はありません`}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredApplications.map((app) => {
                      if (!app.job) return null
                      const jobWithStatus: Job = {
                        ...app.job,
                        applicationStatus: app.status,
                        recruitmentStatus: app.job.recruitmentStatus,
                      }
                      const isEnded = app.status === "見送り" || app.job.recruitmentStatus === "クローズ"
                      return (
                        <JobCard
                          key={app.id}
                          job={jobWithStatus}
                          onViewDetail={isEnded ? () => {} : setSelectedJobId}
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
            </div>
          )}
        </>
      )}

      {/* マイページタブ */}
      {activeTab === "profile" && (
        <SidebarLayout
          activeMenu={activeProfileMenu}
          onMenuChange={(menuId) => setActiveProfileMenu(menuId as ProfileMenuItem)}
        >
          <div className="p-4 md:p-6">
            {isLoadingProfile && talent === null ? (
              <div className="text-center py-8">
                <p style={{ color: "var(--pw-text-gray)" }}>データを読み込んでいます...</p>
              </div>
            ) : (
              <>
                {activeProfileMenu === "profile" && (
                  <div>
                    <h2 className="font-bold mb-6" style={{ fontSize: "var(--pw-text-xl)", color: "var(--pw-text-navy)" }}>
                      プロフィール
                    </h2>
                    {talent && <ProfileForm user={talent} onUpdate={setTalent} />}
                  </div>
                )}
                {activeProfileMenu === "work-history" && (
                  <div>
                    <h2 className="font-bold mb-6" style={{ fontSize: "var(--pw-text-xl)", color: "var(--pw-text-navy)" }}>
                      職歴・資格
                    </h2>
                    {talent && <WorkHistoryForm user={talent} onUpdate={setTalent} />}
                  </div>
                )}
                {activeProfileMenu === "preferences" && (
                  <div>
                    <h2 className="font-bold mb-6" style={{ fontSize: "var(--pw-text-xl)", color: "var(--pw-text-navy)" }}>
                      希望条件
                    </h2>
                    {talent && <PreferencesForm user={talent} onUpdate={setTalent} />}
                  </div>
                )}
                {activeProfileMenu === "settings" && (
                  <div>
                    <h2 className="font-bold mb-6" style={{ fontSize: "var(--pw-text-xl)", color: "var(--pw-text-navy)" }}>
                      登録情報
                    </h2>
                    <SettingsForm user={talent} />
                  </div>
                )}
              </>
            )}
          </div>
        </SidebarLayout>
      )}

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
