import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"
import { ApplicationsClient } from "@/components/applications-client"
import { getApplicationsWithJobs } from "@/lib/server/applications"

export default async function ApplicationsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  // サーバーサイドで応募データを事前取得（SSR）
  // これによりクライアント側でのAPI呼び出しを削減し、初期表示を高速化
  let initialApplications: Awaited<ReturnType<typeof getApplicationsWithJobs>> = []
  try {
    initialApplications = await getApplicationsWithJobs(session.user.id)
  } catch (error) {
    console.error("サーバーサイドでの応募データ取得に失敗:", error)
    // エラー時はクライアント側でフォールバック取得
  }

  return (
    <ApplicationsClient
      user={session}
      initialApplications={initialApplications}
    />
  )
}

