"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PWInput } from "@/components/ui/pw-input"
import { Label } from "@/components/ui/label"
import { CenteredLayout } from "@/components/layouts"
import { PWAlert } from "@/components/ui/pw-alert"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"

export default function CompleteProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    lastNameKana: "",
    firstNameKana: "",
    phone: "",
    birthDate: "",
  })

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
      router.push("/me")
    } catch (error) {
      toast({
        title: "エラー",
        description: "プロフィールの更新に失敗しました。",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

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
          プロフィールを入力して、登録を完了させましょう
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PWAlert variant="info" title="以下の情報を入力してください">
          <p style={{ fontSize: "var(--pw-text-xs)" }}>
            これらの情報は案件への応募や企業とのマッチングに使用されます。
          </p>
        </PWAlert>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="lastName"
              className="text-[var(--pw-text-primary)] mb-1 block"
              style={{ fontSize: "var(--pw-text-sm)" }}
            >
              姓 <span style={{ color: "var(--pw-alert-error)" }}>*</span>
            </Label>
            <PWInput
              id="lastName"
              type="text"
              placeholder="山田"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label
              htmlFor="firstName"
              className="text-[var(--pw-text-primary)] mb-1 block"
              style={{ fontSize: "var(--pw-text-sm)" }}
            >
              名 <span style={{ color: "var(--pw-alert-error)" }}>*</span>
            </Label>
            <PWInput
              id="firstName"
              type="text"
              placeholder="太郎"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              required
            />
          </div>
        </div>

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

        <div>
          <Label
            htmlFor="phone"
            className="text-[var(--pw-text-primary)] mb-1 block"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            電話番号 <span style={{ color: "var(--pw-alert-error)" }}>*</span>
          </Label>
          <PWInput
            id="phone"
            type="tel"
            placeholder="090-1234-5678"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            required
          />
          <p
            className="mt-1"
            style={{
              fontSize: "var(--pw-text-xs)",
              color: "var(--pw-text-light-gray)"
            }}
          >
            ハイフンありでも、なしでもOKです
          </p>
        </div>

        <div>
          <Label
            htmlFor="birthDate"
            className="text-[var(--pw-text-primary)] mb-1 block"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            生年月日 <span style={{ color: "var(--pw-alert-error)" }}>*</span>
          </Label>
          <PWInput
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) =>
              setFormData({ ...formData, birthDate: e.target.value })
            }
            required
          />
        </div>

        <Button
          type="submit"
          variant="pw-primary"
          className="w-full py-6"
          disabled={loading}
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

