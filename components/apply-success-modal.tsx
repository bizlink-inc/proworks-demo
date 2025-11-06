"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-6 h-6" />
            応募が完了しました
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">案件名</p>
            <p className="font-medium">{jobTitle}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">応募受付日</p>
            <p className="font-medium">{format(new Date(appliedAt), "yyyy/MM/dd HH:mm")}</p>
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          OK
        </Button>
      </DialogContent>
    </Dialog>
  )
}
