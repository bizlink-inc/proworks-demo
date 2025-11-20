"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"
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
  const [isAlreadyApplied, setIsAlreadyApplied] = useState(false)

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      setIsAlreadyApplied(false)
      return
    }

    console.log("[v0] 案件詳細取得開始:", jobId)

    setLoading(true)
    Promise.all([
      // 案件詳細を取得
      fetch(`/api/jobs/${jobId}`)
        .then((res) => res.json()),
      // 応募済みの案件一覧を取得
      fetch(`/api/applications/me`)
        .then((res) => res.json())
    ])
      .then(([jobData, applicationsData]) => {
        console.log("[v0] 案件詳細取得成功:", jobData)
        setJob(jobData)
        
        // 現在の案件が応募済みかどうかをチェック
        const isApplied = applicationsData.some(
          (app: any) => app.jobId === jobId
        )
        setIsAlreadyApplied(isApplied)
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

  const renderRow = (label: string, value?: React.ReactNode) => {
    if (!value) return null
    return (
      <div
        className="flex"
        style={{ borderTop: "1px solid #d5e5f0" }}
      >
        <div
          className="py-3 pr-4"
          style={{
            width: "140px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#30373f",
          }}
        >
          {label}
        </div>
        <div
          className="flex-1 py-3"
          style={{
            fontSize: "13px",
            color: "#000000",
            lineHeight: 1.6,
          }}
        >
          {value}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={!!jobId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:min-w-[600px] sm:max-w-[680px]">
        {/* アクセシビリティ用タイトル（画面上では非表示） */}
        <DialogTitle className="sr-only">
          {job?.title || "案件詳細"}
        </DialogTitle>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">読み込み中...</div>
        ) : job ? (
          <div>
            <div className="px-8 pt-6 pb-4">
            {job.features.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 justify-end">
                  {job.features.slice(0, 3).map((feature, index) => (
                    <span
                      key={feature}
                      className="px-3 py-1 text-xs font-semibold rounded-[2px]"
                      style={{
                        border: index === 0 ? "1px solid #e9277a" : "1px solid #686868",
                        backgroundColor: index === 0 ? "#fde3ef" : "#ffffff",
                        color: index === 0 ? "#e9277a" : "#686868",
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}

              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#1f3151",
                }}
              >
                {job.title}
              </h2>
              </div>

            <div className="px-8 pb-4">
              {renderRow(
                "報酬単価（税抜）",
                job.rate && (
                  <span>
                    <span
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#ea8737",
                      }}
                    >
                      {formatCurrency(job.rate)}
                    </span>
                    <span style={{ marginLeft: 4 }}>万円/月</span>
                  </span>
                ),
              )}

            {renderRow(
                "職種ポジション",
                job.position.length > 0 &&
                  job.position.map((pos) => (
                    <span
                      key={pos}
                      className="mr-3"
                      style={{ color: "#1f3151", fontWeight: 500 }}
                    >
                      {pos}
                    </span>
                  )),
            )}

              {renderRow(
                "必須スキル",
                job.requiredSkills && (
                  <span style={{ color: "#1f3151" }}>{job.requiredSkills}</span>
                ),
            )}

              {renderRow(
                "歓迎スキル",
                job.preferredSkills && (
                  <span style={{ color: "#1f3151" }}>{job.preferredSkills}</span>
                ),
            )}

              {renderRow(
                "作業内容",
                job.description && (
                  <p className="whitespace-pre-wrap">{job.description}</p>
                ),
            )}

              {renderRow(
                "環境",
                job.environment && (
                  <p className="whitespace-pre-wrap">{job.environment}</p>
                ),
              )}

              {renderRow(
                "期間",
                job.period && <span>{job.period}</span>,
              )}

              {renderRow(
                "精算基準時間",
                (job.minHours || job.maxHours) && (
                  <span>
                  {job.minHours && `下限: ${job.minHours}h`}
                  {job.minHours && job.maxHours && " / "}
                  {job.maxHours && `上限: ${job.maxHours}h`}
                  </span>
                ),
            )}

              {renderRow(
                "面談回数",
                job.interviewCount && <span>{job.interviewCount}</span>,
            )}

              {renderRow(
                "勤務地",
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{job.location || "リモート"}</span>
                </span>,
            )}

              {renderRow(
                "最寄り",
                job.nearestStation && <span>{job.nearestStation}</span>,
            )}

              {renderRow(
                "備考",
                job.notes && (
                  <p className="whitespace-pre-wrap">{job.notes}</p>
                ),
              )}
            </div>

            <div
              className="px-8 py-6 flex justify-center"
              style={{ borderTop: "1px solid #d5e5f0" }}
            >
            {isAlreadyApplied ? (
                <Button
                  disabled
                  variant="pw-outline"
                  className="w-full max-w-[260px]"
                  style={{ fontSize: "15px" }}
                >
                応募済み
              </Button>
            ) : (
                <Button
                  variant="pw-primary"
                  onClick={handleApply}
                  className="w-full max-w-[260px]"
                  style={{ fontSize: "15px" }}
                >
                この案件に応募する
              </Button>
            )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
