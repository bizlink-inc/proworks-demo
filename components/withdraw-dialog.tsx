"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { signOut } from "@/lib/auth-client"

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const WITHDRAWAL_REASONS = [
  { value: "案件が見つからない", label: "案件が見つからない" },
  { value: "他サービス利用", label: "他サービス利用" },
  { value: "活動休止", label: "活動休止" },
  { value: "その他", label: "その他" },
]

const CONFIRMATION_ITEMS = [
  "登録情報・履歴が削除されることを理解しました",
  "今後のメール配信が停止されることを理解しました",
  "退会後のサポートは受けられないことを理解しました",
]

export const WithdrawDialog = ({ open, onOpenChange }: WithdrawDialogProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"confirm" | "final">("confirm")
  const [reason, setReason] = useState("")
  const [reasonDetail, setReasonDetail] = useState("")
  const [confirmations, setConfirmations] = useState<boolean[]>([false, false, false])

  const allConfirmed = confirmations.every(Boolean)

  const handleConfirmationChange = (index: number) => {
    const newConfirmations = [...confirmations]
    newConfirmations[index] = !newConfirmations[index]
    setConfirmations(newConfirmations)
  }

  const handleProceed = () => {
    if (!allConfirmed) {
      toast({
        title: "エラー",
        description: "すべての確認事項に同意してください。",
        variant: "destructive",
      })
      return
    }
    setStep("final")
  }

  const handleWithdraw = async () => {
    setLoading(true)

    try {
      const res = await fetch("/api/me/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          reasonDetail,
          confirmationAgreed: true,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "退会処理に失敗しました。")
      }

      toast({
        title: "退会手続きが完了しました",
        description: "ご利用ありがとうございました。",
      })

      // ログアウトしてトップページにリダイレクト
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/"
          },
        },
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "退会処理に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep("confirm")
    setReason("")
    setReasonDetail("")
    setConfirmations([false, false, false])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle
            style={{
              fontSize: "var(--pw-text-lg)",
              fontWeight: "bold",
              color: "var(--pw-text-navy)",
            }}
          >
            {step === "confirm" ? "退会手続き" : "退会の確認"}
          </DialogTitle>
        </DialogHeader>

        {step === "confirm" ? (
          <>
            <div className="px-6 py-4 space-y-4">
              <p style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}>
                退会すると、登録情報はすべて削除され、元に戻すことはできません。
              </p>

              <div className="space-y-3 py-2">
                {CONFIRMATION_ITEMS.map((item, index) => (
                  <label
                    key={index}
                    className="flex items-start gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={confirmations[index]}
                      onChange={() => handleConfirmationChange(index)}
                      className="mt-1 w-4 h-4 rounded border-gray-300"
                      style={{ accentColor: "var(--pw-button-primary)" }}
                    />
                    <span style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>

              <div>
                <Label
                  htmlFor="reason"
                  style={{ color: "var(--pw-text-primary)", marginBottom: "8px", display: "block" }}
                >
                  退会理由（任意）
                </Label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-md"
                  style={{
                    border: "1px solid var(--pw-border-gray)",
                    fontSize: "var(--pw-text-sm)",
                    color: "var(--pw-text-primary)",
                  }}
                >
                  <option value="">選択してください</option>
                  {WITHDRAWAL_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label
                  htmlFor="reasonDetail"
                  style={{ color: "var(--pw-text-primary)", marginBottom: "8px", display: "block" }}
                >
                  詳細（任意）
                </Label>
                <Textarea
                  id="reasonDetail"
                  placeholder="ご意見・ご要望があればお聞かせください"
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                  rows={4}
                  style={{
                    border: "1px solid var(--pw-border-gray)",
                    fontSize: "var(--pw-text-sm)",
                  }}
                />
              </div>
            </div>

            <DialogFooter className="px-6 pb-6 flex-col gap-3">
              {!allConfirmed && (
                <p
                  style={{
                    fontSize: "var(--pw-text-xs)",
                    color: "#dc2626",
                    textAlign: "center",
                    width: "100%",
                  }}
                >
                  ※ すべての確認事項にチェックを入れてください
                </p>
              )}
              <div className="flex gap-3 justify-end w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  style={{ minWidth: "120px", borderRadius: "var(--pw-radius-sm)" }}
                >
                  キャンセル
                </Button>
                <Button
                  type="button"
                  variant="pw-primary"
                  onClick={handleProceed}
                  disabled={!allConfirmed}
                  style={{ minWidth: "120px" }}
                >
                  退会手続きを進める
                </Button>
              </div>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="px-6 py-4">
              <p
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: "var(--pw-text-primary)",
                  textAlign: "center",
                  lineHeight: 1.8,
                }}
              >
                本当に退会してもよろしいですか？<br />
                退会後は、アカウントの再開はできません。
              </p>
            </div>

            <DialogFooter className="px-6 pb-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("confirm")}
                disabled={loading}
                style={{ minWidth: "120px", borderRadius: "var(--pw-radius-sm)" }}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                onClick={handleWithdraw}
                disabled={loading}
                style={{
                  minWidth: "120px",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  borderRadius: "var(--pw-radius-sm)",
                }}
              >
                {loading ? "処理中..." : "はい、退会します"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
