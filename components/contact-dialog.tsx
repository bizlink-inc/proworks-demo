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

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const INQUIRY_CATEGORIES = [
  { value: "案件について", label: "案件について" },
  { value: "登録情報", label: "登録情報" },
  { value: "技術的な問題", label: "技術的な問題" },
  { value: "その他", label: "その他" },
]

export const ContactDialog = ({ open, onOpenChange }: ContactDialogProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState("")
  const [content, setContent] = useState("")

  const handleSubmit = async () => {
    if (!category) {
      toast({
        title: "エラー",
        description: "お問い合わせカテゴリを選択してください。",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "エラー",
        description: "お問い合わせ内容を入力してください。",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/me/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, content }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "送信に失敗しました。")
      }

      toast({
        title: "お問い合わせを受け付けました",
        description: "内容を確認のうえ、担当よりご連絡いたします。",
      })

      // フォームをリセットしてダイアログを閉じる
      setCategory("")
      setContent("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "送信に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] w-[90vw]">
        <DialogHeader className="px-8 pt-8">
          <DialogTitle
            style={{
              fontSize: "var(--pw-text-xl)",
              fontWeight: "bold",
              color: "var(--pw-text-navy)",
            }}
          >
            お問い合わせ
          </DialogTitle>
        </DialogHeader>

        <div className="px-8 py-6 space-y-6">
          <div>
            <Label
              htmlFor="category"
              style={{ color: "var(--pw-text-primary)", marginBottom: "12px", display: "block", fontSize: "var(--pw-text-md)" }}
            >
              お問い合わせカテゴリ <span style={{ color: "#dc2626" }}>*</span>
            </Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-md"
              style={{
                border: "1px solid var(--pw-border-gray)",
                fontSize: "var(--pw-text-md)",
                color: "var(--pw-text-primary)",
              }}
            >
              <option value="">選択してください</option>
              {INQUIRY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label
              htmlFor="content"
              style={{ color: "var(--pw-text-primary)", marginBottom: "12px", display: "block", fontSize: "var(--pw-text-md)" }}
            >
              お問い合わせ内容 <span style={{ color: "#dc2626" }}>*</span>
            </Label>
            <Textarea
              id="content"
              placeholder="お問い合わせ内容をご入力ください"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              style={{
                border: "1px solid var(--pw-border-gray)",
                fontSize: "var(--pw-text-md)",
              }}
            />
          </div>
        </div>

        <DialogFooter className="px-8 pb-8 gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            style={{ minWidth: "160px", padding: "12px 24px", fontSize: "var(--pw-text-md)", borderRadius: "var(--pw-radius-sm)" }}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="pw-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ minWidth: "160px", padding: "12px 24px", fontSize: "var(--pw-text-md)" }}
          >
            {loading ? "送信中..." : "送信する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
