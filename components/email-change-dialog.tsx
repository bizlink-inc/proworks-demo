"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PWInput } from "@/components/ui/pw-input"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons"

interface EmailChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEmail: string
}

export const EmailChangeDialog = ({ open, onOpenChange, currentEmail }: EmailChangeDialogProps) => {
  const { toast } = useToast()
  const [step, setStep] = useState<"form" | "email-sent">("form")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newEmail: "",
  })

  const handleClose = () => {
    // ダイアログを閉じる時にフォームをリセット
    setStep("form")
    setFormData({ currentPassword: "", newEmail: "" })
    setShowPassword(false)
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    // バリデーション
    if (!formData.currentPassword || !formData.newEmail) {
      toast({
        title: "エラー",
        description: "すべての項目を入力してください。",
        variant: "destructive",
      })
      return
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.newEmail)) {
      toast({
        title: "エラー",
        description: "有効なメールアドレスを入力してください。",
        variant: "destructive",
      })
      return
    }

    // 現在のメールアドレスと同じかチェック
    if (formData.newEmail === currentEmail) {
      toast({
        title: "エラー",
        description: "現在のメールアドレスと同じです。",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newEmail: formData.newEmail,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || "メールアドレス変更に失敗しました。")
      }

      setStep("email-sent")
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "メールアドレス変更に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (step === "email-sent") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px] w-[90vw]">
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div
                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#e8f5f0" }}
              >
                <CheckCircle
                  className="w-8 h-8"
                  style={{ color: "var(--pw-alert-success)" }}
                />
              </div>
              <h2
                className="font-semibold mb-2"
                style={{ fontSize: "var(--pw-text-lg)", color: "var(--pw-text-primary)" }}
              >
                確認メールを送信しました
              </h2>
              <p
                className="mb-4"
                style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-gray)" }}
              >
                <strong>{formData.newEmail}</strong> 宛に確認メールを送信しました。
              </p>
              <p style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-gray)" }}>
                メール内のリンクをクリックして、変更を完了してください。
              </p>
            </div>

            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: "var(--pw-alert-info-bg)", border: "1px solid var(--pw-button-primary)" }}
            >
              <p
                className="font-semibold mb-2"
                style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}
              >
                ご注意：
              </p>
              <ul
                className="list-disc list-inside space-y-1"
                style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-gray)" }}
              >
                <li>確認リンクの有効期限は1時間です</li>
                <li>メールが届かない場合は、迷惑メールフォルダをご確認ください</li>
                <li>確認が完了するまで、現在のメールアドレスが有効です</li>
              </ul>
            </div>

            <Button
              type="button"
              variant="pw-outline"
              onClick={handleClose}
              className="w-full"
              style={{ fontSize: "var(--pw-text-md)" }}
            >
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] w-[90vw]">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle
            style={{
              fontSize: "var(--pw-text-xl)",
              fontWeight: "bold",
              color: "var(--pw-text-navy)",
            }}
          >
            メールアドレスの変更
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6">
          <p style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-gray)" }}>
            セキュリティのため、現在のパスワードを入力してください。<br />
            新しいメールアドレスに確認メールが送信されます。
          </p>

          <div>
            <Label
              htmlFor="currentPassword"
              style={{ color: "var(--pw-text-primary)", marginBottom: "8px", display: "block" }}
            >
              現在のパスワード <span style={{ color: "#dc2626" }}>*</span>
            </Label>
            <div className="relative">
              <PWInput
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                placeholder="現在のパスワードを入力"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--pw-button-primary)" }}
              >
                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <Label
              htmlFor="newEmail"
              style={{ color: "var(--pw-text-primary)", marginBottom: "8px", display: "block" }}
            >
              新しいメールアドレス <span style={{ color: "#dc2626" }}>*</span>
            </Label>
            <PWInput
              id="newEmail"
              type="email"
              placeholder="新しいメールアドレスを入力"
              value={formData.newEmail}
              onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
            style={{ fontSize: "var(--pw-text-md)" }}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="pw-primary"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1"
            style={{ fontSize: "var(--pw-text-md)" }}
          >
            {loading ? "送信中..." : "確認メールを送信"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
