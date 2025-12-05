"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PWInput } from "@/components/ui/pw-input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CenteredLayout } from "@/components/layouts"
import { PWAlert } from "@/components/ui/pw-alert"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"

export default function CompleteProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    lastNameKana: "",
    firstNameKana: "",
    desiredWorkStyle: [] as string[],
    availableFrom: "",
    desiredRate: "",
  })

  const workStyleOptions = ["リモート", "ハイブリッド", "常駐"]

  const toggleWorkStyle = (style: string) => {
    setFormData((prev) => ({
      ...prev,
      desiredWorkStyle: prev.desiredWorkStyle.includes(style)
        ? prev.desiredWorkStyle.filter((s) => s !== style)
        : [...prev.desiredWorkStyle, style],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("プロフィールの更新に失敗しました")
      }

      toast({
        title: "登録完了",
        description: "プロフィールが登録されました。",
      })

      // マイページにリダイレクト
      router.push("/auth/welcome")
    } catch (error) {
      toast({
        title: "エラー",
        description: "プロフィールの更新に失敗しました。",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  // バリデーション：フリガナは必須
  const isFormValid = formData.lastNameKana && formData.firstNameKana

  return (
    <CenteredLayout showFooter={false}>
      <div className="text-center mb-6">
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "#e8f5f0" }}
        >
          <CheckCircle
            className="w-8 h-8"
            style={{ color: "var(--pw-alert-success)" }}
          />
        </div>
        <h1
          className="font-bold mb-2"
          style={{
            fontSize: "var(--pw-text-2xl)",
            color: "var(--pw-text-primary)"
          }}
        >
          メール認証が完了しました
        </h1>
        <p
          className="text-[var(--pw-text-gray)]"
          style={{ fontSize: "var(--pw-text-sm)" }}
        >
          あと少しで登録完了です！<br />
          以下の情報を入力すると、より精度の高い案件マッチングが可能になります。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PWAlert variant="info" title="プロフィールを完成させましょう">
          <p style={{ fontSize: "var(--pw-text-xs)" }}>
            これらの情報は案件への応募や企業とのマッチングに使用されます。
          </p>
        </PWAlert>

        {/* フリガナ */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="lastNameKana"
              className="text-[var(--pw-text-primary)] mb-1 block"
              style={{ fontSize: "var(--pw-text-sm)" }}
            >
              姓（フリガナ） <span style={{ color: "var(--pw-alert-error)" }}>*</span>
            </Label>
            <PWInput
              id="lastNameKana"
              type="text"
              placeholder="ヤマダ"
              value={formData.lastNameKana}
              onChange={(e) =>
                setFormData({ ...formData, lastNameKana: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label
              htmlFor="firstNameKana"
              className="text-[var(--pw-text-primary)] mb-1 block"
              style={{ fontSize: "var(--pw-text-sm)" }}
            >
              名（フリガナ） <span style={{ color: "var(--pw-alert-error)" }}>*</span>
            </Label>
            <PWInput
              id="firstNameKana"
              type="text"
              placeholder="タロウ"
              value={formData.firstNameKana}
              onChange={(e) =>
                setFormData({ ...formData, firstNameKana: e.target.value })
              }
              required
            />
          </div>
        </div>

        {/* 希望勤務スタイル */}
        <div>
          <Label
            className="text-[var(--pw-text-primary)] mb-2 block"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            希望勤務スタイル（複数選択可）
          </Label>
          <div className="space-y-2">
            {workStyleOptions.map((style) => (
              <div key={style} className="flex items-center space-x-2">
                <Checkbox
                  id={`workstyle-${style}`}
                  checked={formData.desiredWorkStyle.includes(style)}
                  onCheckedChange={() => toggleWorkStyle(style)}
                  className="data-[state=checked]:bg-[var(--pw-button-primary)] data-[state=checked]:border-[var(--pw-button-primary)]"
                />
                <Label
                  htmlFor={`workstyle-${style}`}
                  className="cursor-pointer"
                  style={{ fontSize: "var(--pw-text-sm)" }}
                >
                  {style}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* 稼働可能時期 */}
        <div>
          <Label
            htmlFor="availableFrom"
            className="text-[var(--pw-text-primary)] mb-1 block"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            稼働可能時期
          </Label>
          <PWInput
            id="availableFrom"
            type="date"
            value={formData.availableFrom}
            onChange={(e) =>
              setFormData({ ...formData, availableFrom: e.target.value })
            }
          />
          <p
            className="mt-1"
            style={{
              fontSize: "var(--pw-text-xs)",
              color: "var(--pw-text-light-gray)"
            }}
          >
            すぐに稼働可能な場合は空欄のままでOKです
          </p>
        </div>

        {/* 希望単価 */}
        <div>
          <Label
            htmlFor="desiredRate"
            className="text-[var(--pw-text-primary)] mb-1 block"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            希望単価（月額・万円）
          </Label>
          <div className="flex items-center gap-2">
            <PWInput
              id="desiredRate"
              type="number"
              placeholder="60"
              value={formData.desiredRate}
              onChange={(e) =>
                setFormData({ ...formData, desiredRate: e.target.value })
              }
              className="flex-1"
            />
            <span
              style={{
                fontSize: "var(--pw-text-sm)",
                color: "var(--pw-text-gray)"
              }}
            >
              万円〜
            </span>
          </div>
          <p
            className="mt-1"
            style={{
              fontSize: "var(--pw-text-xs)",
              color: "var(--pw-text-light-gray)"
            }}
          >
            案件マッチングの参考にさせていただきます
          </p>
        </div>

        <Button
          type="submit"
          variant="pw-primary"
          className="w-full py-6"
          disabled={loading || !isFormValid}
          style={{ fontSize: "var(--pw-text-lg)" }}
        >
          {loading ? "登録中..." : "プロフィールを完成させる"}
        </Button>

        <p
          className="text-center"
          style={{
            fontSize: "var(--pw-text-xs)",
            color: "var(--pw-text-light-gray)"
          }}
        >
          後からマイページで詳細なプロフィールを追加できます
        </p>
      </form>
    </CenteredLayout>
  )
}
