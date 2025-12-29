import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"
import { ApplicationsClient } from "@/components/applications-client"
import { getApplicationsWithJobs } from "@/lib/server/applications"
import { Header } from "@/components/header"
import { FullWidthLayout } from "@/components/layouts"
import { Skeleton } from "@/components/ui/skeleton"

// 案件カードのスケルトン
function JobCardSkeleton() {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #d5e5f0"
      }}
    >
      {/* ステータスバッジ */}
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-5 w-16" />
      </div>

      {/* タイトル */}
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4 mb-4" />

      {/* 金額 */}
      <div className="flex items-baseline gap-1 mb-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* 区切り線 */}
      <div className="border-t border-[#d5e5f0] my-4" />

      {/* 職種・スキル */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-12" />
          <div className="flex gap-1 flex-wrap">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-14" />
          </div>
        </div>
      </div>

      {/* ボタン */}
      <div className="mt-5">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  )
}

// ローディング表示コンポーネント（スケルトン表示）
function ApplicationsLoading({ user }: { user: { id?: string; name?: string | null; email?: string | null } }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--pw-bg-light)" }}>
      <Header user={user} />
      <FullWidthLayout>
        {/* ヘッダー部分のスケルトン */}
        <div className="mb-6">
          <div className="flex items-center gap-8 flex-wrap">
            <Skeleton className="h-6 w-20" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>

        {/* カードグリッドのスケルトン */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      </FullWidthLayout>
    </div>
  )
}

// データ取得コンポーネント（Suspense内で実行）
async function ApplicationsContent({ userId, user }: {
  userId: string
  user: { id?: string; name?: string | null; email?: string | null }
}) {
  let initialApplications: Awaited<ReturnType<typeof getApplicationsWithJobs>> = []
  try {
    initialApplications = await getApplicationsWithJobs(userId)
  } catch (error) {
    console.error("サーバーサイドでの応募データ取得に失敗:", error)
    // エラー時はクライアント側でフォールバック取得
  }

  return (
    <ApplicationsClient
      user={user}
      initialApplications={initialApplications}
    />
  )
}

export default async function ApplicationsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  // Suspenseでストリーミング: ヘッダー付きローディングを即表示し、データ取得後にコンテンツを差し替え
  return (
    <Suspense fallback={<ApplicationsLoading user={session.user} />}>
      <ApplicationsContent userId={session.user.id} user={session.user} />
    </Suspense>
  )
}

