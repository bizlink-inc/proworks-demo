"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, X } from "lucide-react"
import type { Job } from "@/lib/kintone/types"
import { formatCurrency } from "@/lib/utils"

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            {/* 案件特徴 */}
            {job.features.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">案件特徴</h3>
                <div className="flex flex-wrap gap-2">
                  {job.features.map((feature) => (
                    <Badge key={feature} variant="outline">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 職種ポジション */}
            {job.position.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">職種ポジション</h3>
                <div className="flex flex-wrap gap-2">
                  {job.position.map((pos) => (
                    <Badge key={pos} variant="secondary">
                      {pos}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 作業内容 */}
            {job.description && (
              <div>
                <h3 className="font-semibold mb-2">作業内容</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              </div>
            )}

            {/* 環境 */}
            {job.environment && (
            <div>
                <h3 className="font-semibold mb-2">環境</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.environment}</p>
            </div>
            )}

            {/* 必須スキル */}
            {job.requiredSkills && (
            <div>
                <h3 className="font-semibold mb-2">必須スキル</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.requiredSkills}</p>
            </div>
            )}

            {/* 歓迎スキル */}
            {job.preferredSkills && (
            <div>
                <h3 className="font-semibold mb-2">歓迎スキル</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.preferredSkills}</p>
            </div>
            )}

            {/* 勤務地 */}
            <div>
              <h3 className="font-semibold mb-2">勤務地</h3>
              <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                  <span>{job.location || "リモート"}</span>
                </div>
                {job.nearestStation && (
                  <p className="text-sm text-muted-foreground ml-6">最寄駅: {job.nearestStation}</p>
                )}
              </div>
            </div>

            {/* 精算基準時間 */}
            {(job.minHours || job.maxHours) && (
            <div>
                <h3 className="font-semibold mb-2">精算基準時間</h3>
                <p>
                  {job.minHours && `下限: ${job.minHours}h`}
                  {job.minHours && job.maxHours && " / "}
                  {job.maxHours && `上限: ${job.maxHours}h`}
                </p>
              </div>
            )}

            {/* 期間 */}
            {job.period && (
            <div>
                <h3 className="font-semibold mb-2">期間</h3>
                <p>{job.period}</p>
            </div>
            )}

            {/* 金額 */}
            {job.rate && (
            <div>
                <h3 className="font-semibold mb-2">金額</h3>
                <p className="text-xl font-semibold text-blue-600">{formatCurrency(job.rate)}</p>
            </div>
            )}

            {/* 面談回数 */}
            {job.interviewCount && (
            <div>
                <h3 className="font-semibold mb-2">面談回数</h3>
                <p>{job.interviewCount}</p>
            </div>
            )}

            {/* 備考 */}
            {job.notes && (
            <div>
                <h3 className="font-semibold mb-2">備考</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.notes}</p>
            </div>
            )}

            <Button onClick={handleApply} className="w-full bg-blue-600 hover:bg-blue-700">
              この案件に応募する
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
