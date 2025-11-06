import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { applications } from "@/lib/mockdb"

export async function POST(request: NextRequest) {
  console.log("[v0] 応募API呼び出し")

  const session = await getSession()
  console.log("[v0] セッション情報:", session)

  if (!session?.id) {
    console.log("[v0] 認証エラー: セッションなし")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { jobId } = body
  console.log("[v0] 応募リクエスト:", { jobId, userId: session.id })

  // 重複チェック
  const exists = applications.find((app) => app.jobId === jobId && app.userId === session.id)

  if (exists) {
    console.log("[v0] 重複応募検出")
    return NextResponse.json({ error: "Already applied" }, { status: 409 })
  }

  const newApp = {
    id: `app${applications.length + 1}`,
    jobId,
    userId: session.id,
    status: "回答待ち" as const,
    appliedAt: new Date().toISOString(),
  }

  applications.push(newApp)
  console.log("[v0] 応募登録成功:", newApp)

  return NextResponse.json(newApp, { status: 201 })
}
