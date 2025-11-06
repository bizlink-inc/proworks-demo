"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import type { Application, Job } from "@/lib/mockdb"

type ApplicationWithJob = Application & {
  job: Job
}

const statusColors = {
  回答待ち: "bg-yellow-500",
  応募終了: "bg-gray-500",
  面談調整中: "bg-blue-500",
  契約締結: "bg-green-500",
}

export function ApplicationsTable() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const appsRes = await fetch("/api/applications/me")
        const apps: Application[] = await appsRes.json()

        const appsWithJobs = await Promise.all(
          apps.map(async (app) => {
            const jobRes = await fetch(`/api/jobs/${app.jobId}`)
            const job = await jobRes.json()
            return { ...app, job }
          }),
        )

        setApplications(appsWithJobs)
      } catch (error) {
        console.error("Failed to fetch applications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">読み込み中...</div>
  }

  if (applications.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-muted-foreground">応募している案件がありません</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>案件名</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>応募受付日</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <TableRow key={app.id}>
              <TableCell className="font-medium">{app.job.title}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusColors[app.status]}`} />
                  <span>{app.status}</span>
                </div>
              </TableCell>
              <TableCell>{format(new Date(app.appliedAt), "yyyy/MM/dd HH:mm")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
