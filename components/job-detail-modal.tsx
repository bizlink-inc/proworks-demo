"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, X } from "lucide-react"
import type { Job } from "@/lib/mockdb"

type JobDetailModalProps = {
  jobId: string | null
  onClose: () => void
  onApply: (jobId: string, jobTitle: string) => void
}

export function JobDetailModal({ jobId, onClose, onApply }: JobDetailModalProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      return
    }

    console.log("[v0] 案件詳細取得開始:", jobId)

    setLoading(true)
    fetch(`/api/jobs/${jobId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("[v0] 案件詳細取得成功:", data)
        setJob(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("[v0] 案件詳細取得エラー:", error)
        setLoading(false)
      })
  }, [jobId])

  const handleApply = () => {
    console.log("[v0] 応募ボタンクリック:", { jobId: job?.id, jobTitle: job?.title })

    if (job) {
      onApply(job.id, job.title)
    }
  }

  return (
    <Dialog open={!!jobId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl pr-8">{job?.title}</DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">閉じる</span>
            </button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">読み込み中...</div>
        ) : job ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">会社名</h3>
              <p>{job.company.name}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">単価</h3>
              <p className="text-xl font-semibold text-blue-600">
                ¥{job.unitPrice.min.toLocaleString()} - ¥{job.unitPrice.max.toLocaleString()}/月
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">契約形態</h3>
              <p>{job.contractType}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">勤務地</h3>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">募集スキル</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">必須スキル</h3>
              <ul className="list-disc list-inside space-y-1">
                {job.requiredSkills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">歓迎スキル</h3>
              <ul className="list-disc list-inside space-y-1">
                {job.preferredSkills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">稼働時間</h3>
              <p>{job.workingHours}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">プロジェクト概要</h3>
              <p className="text-muted-foreground">{job.description}</p>
            </div>

            <Button onClick={handleApply} className="w-full bg-blue-600 hover:bg-blue-700">
              この案件に応募する
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
