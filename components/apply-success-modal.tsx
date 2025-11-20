"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { format } from "date-fns"

type ApplySuccessModalProps = {
  isOpen: boolean
  jobTitle: string
  appliedAt: string
  onClose: () => void
}

export function ApplySuccessModal({ isOpen, jobTitle, appliedAt, onClose }: ApplySuccessModalProps) {
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
