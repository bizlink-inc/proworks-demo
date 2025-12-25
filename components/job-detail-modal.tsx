"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { Job } from "@/lib/kintone/types"

type JobDetailModalProps = {
  jobId: string | null
  onClose: () => void
  onApply: (jobId: string, jobTitle: string) => Promise<void> | void
}

// 青色（案件タイトル等と同じ色）
const blueColor = "#3d8ab8"

export function JobDetailModal({ jobId, onClose, onApply }: JobDetailModalProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAlreadyApplied, setIsAlreadyApplied] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      setIsAlreadyApplied(false)
      return
    }

    setLoading(true)
    Promise.all([
      // 案件詳細を取得
      fetch(`/api/jobs/${jobId}`)
        .then((res) => res.json()),
      // 応募済みの案件ID一覧を取得（軽量版）
      fetch(`/api/applications/applied-job-ids`)
        .then((res) => res.json())
    ])
      .then(([jobData, appliedData]) => {
        setJob(jobData)

        // 現在の案件が応募済みかどうかをチェック
        const isApplied = appliedData.appliedJobIds?.includes(jobId) || false
        setIsAlreadyApplied(isApplied)
        setLoading(false)
      })
      .catch((error) => {
        console.error("[v0] 案件詳細取得エラー:", error)
        setLoading(false)
      })
  }, [jobId])

  const handleApply = async () => {
    if (job && !isApplying) {
      setIsApplying(true)
      try {
        await onApply(job.id, job.title)
      } finally {
        setIsApplying(false)
      }
    }
  }

  // 通常の行（黒文字）
  const renderRow = (label: string, value?: React.ReactNode, isFirst: boolean = false) => {
    if (!value) return null
    return (
      <div
        className="flex"
        style={{ borderTop: isFirst ? "none" : "1px solid #d5e5f0" }}
      >
        <div
          className="py-3 pr-4"
          style={{
            width: "140px",
            fontSize: "13px",
            fontWeight: 700,
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

  // 青文字の行（職種ポジション、必須スキル、歓迎スキル用）
  const renderBlueRow = (label: string, value?: React.ReactNode) => {
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
            fontWeight: 700,
            color: "#30373f",
          }}
        >
          {label}
        </div>
        <div
          className="flex-1 py-3"
          style={{
            fontSize: "13px",
            color: blueColor,
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
      <DialogContent className="max-h-[90vh] !overflow-hidden flex flex-col sm:min-w-[600px] sm:max-w-[680px]">
        {/* アクセシビリティ用タイトル（画面上では非表示） */}
        <DialogTitle className="sr-only">
          {job?.title || "案件詳細"}
        </DialogTitle>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">読み込み中...</div>
        ) : job && job.title ? (
          <>
            {/* スクロール可能なコンテンツ領域 */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-8 pt-6 pb-4">
                {job.features && job.features.length > 0 && (
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
                    color: blueColor,
                  }}
                >
                  {job.title}
                </h2>
              </div>

              <div className="px-8 pb-4">
                {/* 報酬単価（税抜）- 最初の行なので上線なし */}
                {job.rate && (
                  <div className="flex">
                    <div
                      className="py-3 pr-4"
                      style={{
                        width: "140px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#30373f",
                      }}
                    >
                      報酬単価（税抜）
                    </div>
                    <div
                      className="flex-1 py-3"
                      style={{
                        fontSize: "13px",
                        lineHeight: 1.6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#ea8737",
                        }}
                      >
                        {job.rate}
                      </span>
                      <span style={{ fontWeight: 700, marginLeft: 4 }}>万円／月</span>
                    </div>
                  </div>
                )}

                {renderBlueRow(
                  "職種ポジション",
                  job.position && job.position.length > 0 &&
                    job.position.map((pos, index) => (
                      <span
                        key={pos}
                        style={{ fontWeight: 500 }}
                      >
                        {pos}
                        {index < job.position.length - 1 && "　"}
                      </span>
                    )),
                )}

                {renderBlueRow(
                  "必須スキル",
                  job.requiredSkills && (
                    <span>{job.requiredSkills}</span>
                  ),
                )}

                {renderBlueRow(
                  "歓迎スキル",
                  job.preferredSkills && (
                    <span>{job.preferredSkills}</span>
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
                      {job.minHours && job.maxHours
                        ? `${job.minHours}〜${job.maxHours}時間`
                        : job.minHours
                          ? `${job.minHours}時間〜`
                          : `〜${job.maxHours}時間`
                      }
                    </span>
                  ),
                )}

                {renderRow(
                  "面談回数",
                  job.interviewCount && <span>{job.interviewCount}</span>,
                )}

                {renderRow(
                  "勤務地",
                  <span>{job.location || "リモート"}</span>,
                )}

                {renderRow(
                  "最寄り駅",
                  job.nearestStation && <span>{job.nearestStation}</span>,
                )}

                {renderRow(
                  "備考",
                  job.notes ? (
                    <p className="whitespace-pre-wrap">{job.notes}</p>
                  ) : (
                    <span></span>
                  ),
                )}
              </div>
            </div>

            {/* 応募済みの場合はボタンを表示しない - フッターに固定 */}
            {!isAlreadyApplied && (
              <div
                className="px-8 py-6 flex justify-center flex-shrink-0"
                style={{ borderTop: "1px solid #d5e5f0" }}
              >
                <Button
                  variant="pw-primary"
                  onClick={handleApply}
                  disabled={isApplying}
                  className="w-full max-w-[260px]"
                  style={{ fontSize: "15px" }}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      応募中...
                    </>
                  ) : (
                    "この案件に応募する"
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            案件情報を取得できませんでした
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
