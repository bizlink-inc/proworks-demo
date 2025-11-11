"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { DashboardFilters } from "@/components/dashboard-filters"
import { JobCard } from "@/components/job-card"
import { JobDetailModal } from "@/components/job-detail-modal"
import { ApplySuccessModal } from "@/components/apply-success-modal"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Job } from "@/lib/kintone/types"

interface DashboardClientProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
}

export function DashboardClient({ user }: DashboardClientProps) {
  const { toast } = useToast()

  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ query: "", loc: "All", sort: "new" })
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState<{
    jobTitle: string
    appliedAt: string
  } | null>(null)

  const size = 6
  const totalPages = Math.ceil(total / size)

  useEffect(() => {
    fetchJobs()
  }, [page, filters])

  const fetchJobs = async () => {
    const params = new URLSearchParams({
      query: filters.query,
      loc: filters.loc,
      sort: filters.sort,
      page: page.toString(),
      size: size.toString(),
    })

    const res = await fetch(`/api/jobs?${params}`)
    const data = await res.json()
    setJobs(data.items)
    setTotal(data.total)
  }

  const handleSearch = (newFilters: typeof filters) => {
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
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">案件ダッシュボード</h1>

        <DashboardFilters onSearch={handleSearch} />

        <div className="mb-4 text-sm text-muted-foreground">{total}件の案件が見つかりました</div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onViewDetail={setSelectedJobId} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                onClick={() => setPage(p)}
                className={p === page ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {p}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>

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
