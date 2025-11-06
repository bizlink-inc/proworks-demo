import { type NextRequest, NextResponse } from "next/server"
import { jobs } from "@/lib/mockdb"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("query") || ""
  const loc = searchParams.get("loc") || "All"
  const sort = searchParams.get("sort") || "new"
  const page = Number.parseInt(searchParams.get("page") || "1")
  const size = Number.parseInt(searchParams.get("size") || "6")

  let filtered = jobs.filter((job) => {
    const matchQuery = query
      ? job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.skills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
      : true
    const matchLoc = loc === "All" ? true : job.location === loc
    return matchQuery && matchLoc
  })

  // ソート
  if (sort === "new") {
    filtered = filtered.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1))
  } else if (sort === "price") {
    filtered = filtered.sort((a, b) => b.unitPrice.max - a.unitPrice.max)
  }

  const total = filtered.length
  const start = (page - 1) * size
  const items = filtered.slice(start, start + size)

  return NextResponse.json({ items, total, page, size })
}
