"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

type ApplySuccessModalProps = {
  isOpen: boolean
  jobTitle: string
  appliedAt: string
  missingFields?: string[]
  onClose: () => void
}

export function ApplySuccessModal({ isOpen, jobTitle, appliedAt, missingFields, onClose }: ApplySuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:min-w-[500px] sm:max-w-[500px]">
        {/* アクセシビリティ用タイトル（画面上では非表示） */}
        <DialogTitle className="sr-only">応募完了</DialogTitle>
        
        <div className="px-8">
          {/* タイトル部分 */}
          <div 
            className="flex items-center justify-center gap-3 py-6"
            style={{
              borderBottom: "1px solid #d5e5f0"
            }}
          >
            <CheckCircle2 
              className="w-8 h-8"
              style={{ color: "#3f9c78" }}
            />
            <h2
              className="font-semibold"
              style={{
                fontSize: "18px",
                color: "#1f3151"
              }}
            >
              応募が完了しました
            </h2>
          </div>

          {/* 情報行 */}
          <div>
            <div
              className="flex"
              style={{ borderTop: "1px solid #d5e5f0" }}
            >
              <div
                className="py-3 pr-4"
                style={{
                  width: "120px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#30373f",
                }}
              >
                案件名
              </div>
              <div
                className="flex-1 py-3"
                style={{
                  fontSize: "13px",
                  color: "#000000",
                  lineHeight: 1.6,
                }}
              >
                {jobTitle}
              </div>
            </div>

            <div
              className="flex"
              style={{ borderTop: "1px solid #d5e5f0" }}
            >
              <div
                className="py-3 pr-4"
                style={{
                  width: "120px",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#30373f",
                }}
              >
                応募受付日
              </div>
              <div
                className="flex-1 py-3"
                style={{
                  fontSize: "13px",
                  color: "#000000",
                  lineHeight: 1.6,
                }}
              >
                {format(new Date(appliedAt), "yyyy/MM/dd HH:mm")}
              </div>
            </div>
          </div>

          {/* 未入力項目がある場合のメッセージ */}
          {missingFields && missingFields.length > 0 && (
            <div
              className="py-6"
              style={{ borderTop: "1px solid #d5e5f0" }}
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle 
                  className="w-5 h-5 flex-shrink-0 mt-0.5"
                  style={{ color: "#ea8737" }}
                />
                <div className="flex-1">
                  <p
                    className="mb-2 font-semibold"
                    style={{
                      fontSize: "14px",
                      color: "#30373f",
                    }}
                  >
                    以下の入力が必須です
                  </p>
                  <p
                    className="mb-3"
                    style={{
                      fontSize: "13px",
                      color: "#30373f",
                      lineHeight: 1.6,
                    }}
                  >
                    入力をすると企業とのマッチ率が高まります。
                  </p>
                  <ul
                    className="list-disc list-inside space-y-1 mb-4"
                    style={{
                      fontSize: "13px",
                      color: "#30373f",
                      lineHeight: 1.6,
                    }}
                  >
                    {missingFields.map((field, index) => (
                      <li key={index}>{field}</li>
                    ))}
                  </ul>
                  <Link href="/me">
                    <Button 
                      variant="pw-primary"
                      className="w-full"
                      style={{ fontSize: "14px" }}
                    >
                      マイページで入力する
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* フッターボタン */}
          <div
            className="py-6 flex justify-center"
            style={{ borderTop: "1px solid #d5e5f0" }}
          >
            <Button 
              onClick={onClose}
              variant="pw-primary"
              className="w-full max-w-[180px]"
              style={{ fontSize: "15px" }}
            >
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
