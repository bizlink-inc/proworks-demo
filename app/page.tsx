import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"
import { UnifiedDashboard } from "@/components/unified-dashboard"
import { getDashboardData } from "@/lib/server/dashboard"
import { Header } from "@/components/header"
import { FullWidthLayout } from "@/components/layouts"
import { Skeleton } from "@/components/ui/skeleton"

// ローディング表示コンポーネント（スケルトン表示）
function DashboardLoading({ user }: { user: { id?: string; name?: string | null; email?: string | null } }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff" }}>
      <Header user={user} />
      {/* タブナビゲーションのスケルトン */}
      <div
        className="mx-auto flex items-center gap-0 border-b px-6"
        style={{ maxWidth: "1400px", borderColor: "#d5e5f0" }}
      >
        <Skeleton className="h-12 w-28 mx-2" />
        <Skeleton className="h-12 w-24 mx-2" />
        <Skeleton className="h-12 w-32 mx-2" />
      </div>
      <FullWidthLayout>
        {/* フィルターのスケルトン */}
        <div className="mb-6 mt-8">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        {/* カードグリッドのスケルトン */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-lg p-5"
              style={{ backgroundColor: "#ffffff", border: "1px solid #d5e5f0" }}
            >
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
          ))}
        </div>
      </FullWidthLayout>
    </div>
  )
}

// データ取得コンポーネント（Suspense内で実行）
// ログイン時に全データを先読みし、画面表示前に取得完了
async function DashboardContent({ userId, user }: {
  userId: string
  user: { id?: string; name?: string | null; email?: string | null }
}) {
  let dashboardData: Awaited<ReturnType<typeof getDashboardData>> = {
    jobs: { items: [], total: 0, totalAll: 0 },
    applications: [],
    profile: null,
  }

  try {
    // 全データを並列取得（案件一覧、応募済み案件、マイページ）
    dashboardData = await getDashboardData(userId)
  } catch (error) {
    console.error("サーバーサイドでの全データ取得に失敗:", error)
    // エラー時はクライアント側でフォールバック取得
  }

  return (
    <UnifiedDashboard
      user={user}
      initialJobs={dashboardData.jobs.items}
      initialTotal={dashboardData.jobs.total}
      initialTotalAll={dashboardData.jobs.totalAll}
      initialApplications={dashboardData.applications}
      initialProfile={dashboardData.profile}
    />
  )
}

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  // Suspenseでストリーミング: スケルトンを即表示し、データ取得後にコンテンツを差し替え
  return (
    <Suspense fallback={<DashboardLoading user={session.user} />}>
      <DashboardContent userId={session.user.id} user={session.user} />
    </Suspense>
  )
}
