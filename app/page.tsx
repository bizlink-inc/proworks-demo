import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"
import { DashboardClient } from "@/components/dashboard-client"
import { getJobsWithRecommendations } from "@/lib/server/jobs"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  // サーバーサイドで案件データを事前取得（SSR）
  // 初期表示に必要なページ1の21件のみ取得（パフォーマンス最適化）
  const PAGE_SIZE = 21 // 3列×7行
  let initialJobs: Awaited<ReturnType<typeof getJobsWithRecommendations>> = { items: [], total: 0, totalAll: 0 }
  try {
    initialJobs = await getJobsWithRecommendations(session.user.id, { skip: 0, limit: PAGE_SIZE })
  } catch (error) {
    console.error("サーバーサイドでの案件データ取得に失敗:", error)
    // エラー時はクライアント側でフォールバック取得
  }

  return (
    <DashboardClient
      user={session.user}
      initialJobs={initialJobs.items}
      initialTotal={initialJobs.total}
      initialTotalAll={initialJobs.totalAll}
    />
  )
}
