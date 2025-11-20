"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { FormSection } from "@/components/ui/form-section"
import type { Application, Job } from "@/lib/kintone/types"

type ApplicationWithJob = Application & {
  job: Job | null
}

const statusColors: Record<string, string> = {
  回答待ち: "bg-yellow-500",
  応募終了: "bg-gray-500",
  面談調整中: "bg-blue-500",
  契約締結: "bg-green-500",
}

export const ApplicationsTable = () => {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch("/api/applications/me")
        const data = await res.json()
        setApplications(data)
      } catch (error) {
        console.error("Failed to fetch applications:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [])

  if (loading) {
    return (
      <FormSection title="応募済み案件">
        <div className="py-8 text-center" style={{ color: "var(--pw-text-gray)" }}>
          読み込み中...
        </div>
      </FormSection>
    )
  }

  if (applications.length === 0) {
    return (
      <FormSection title="応募済み案件">
        <div className="py-16 text-center">
          <p className="text-lg" style={{ color: "var(--pw-text-gray)" }}>
            応募している案件がありません
          </p>
        </div>
      </FormSection>
    )
  }

  return (
    <FormSection title="応募済み案件" description="あなたが応募した案件の一覧です">
      <div className="border rounded-lg" style={{ borderColor: "var(--pw-border-lighter)" }}>
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
                <TableCell className="font-medium">{app.jobTitle}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColors[app.status] || "bg-gray-500"}`} />
                    <span>{app.status}</span>
                  </div>
                </TableCell>
                <TableCell>{format(new Date(app.appliedAt), "yyyy/MM/dd HH:mm")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </FormSection>
  )
}
