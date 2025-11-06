import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { applications } from "@/lib/mockdb"

export async function GET() {
  const session = await getSession()

  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userApps = applications.filter((app) => app.userId === session.id)

  return NextResponse.json(userApps)
}
