"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PWInput } from "@/components/ui/pw-input"
import { Label } from "@/components/ui/label"
import { CenteredLayout } from "@/components/layouts"
import { PWAlert } from "@/components/ui/pw-alert"
import { useToast } from "@/hooks/use-toast"
import { Mail, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [step, setStep] = useState<"form" | "email-sent">("form")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "エラー",
          description: error.message || "パスワードリセットメールの送信に失敗しました。",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setStep("email-sent")
      setLoading(false)
    } catch (error) {
      toast({
        title: "エラー",
        description: "パスワードリセットメールの送信に失敗しました。",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  if (step === "email-sent") {
    return (
      <CenteredLayout>
        <div className="text-center mb-6">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--pw-bg-light-blue)" }}
          >
            <Mail
              className="w-8 h-8"
              style={{ color: "var(--pw-button-primary)" }}
            />
          </div>
          <h1
            className="font-semibold mb-2"
            style={{
              fontSize: "var(--pw-text-xl)",
              color: "var(--pw-text-primary)"
            }}
          >
            メールを送信しました
          </h1>
          <p
            className="text-[var(--pw-text-gray)]"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            {email} 宛にパスワードリセット用のリンクを送信しました。
          </p>
        </div>

        <PWAlert variant="info" title="次のステップ：">
          <ol className="list-decimal list-inside space-y-1">
            <li>受信トレイを確認</li>
            <li>メール内のリンクをクリック</li>
            <li>新しいパスワードを設定</li>
          </ol>
        </PWAlert>

        <p
          className="text-center mt-4 mb-4"
          style={{
            fontSize: "var(--pw-text-xs)",
            color: "var(--pw-text-light-gray)"
          }}
        >
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>

        <Link href="/auth/signin">
          <Button variant="pw-outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ログインページに戻る
          </Button>
        </Link>
      </CenteredLayout>
    )
  }

  return (
    <CenteredLayout>
      <div className="text-center mb-8">
        <h1
          className="font-bold mb-2"
          style={{
            fontSize: "var(--pw-text-2xl)",
            color: "var(--pw-border-dark)"
          }}
        >
          パスワードをリセット
        </h1>
        <p
          className="text-[var(--pw-text-gray)]"
          style={{ fontSize: "var(--pw-text-sm)" }}
        >
          登録済みのメールアドレスを入力してください
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label
            htmlFor="email"
            className="text-[var(--pw-text-primary)] mb-1 block"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            メールアドレス
          </Label>
          <PWInput
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          variant="pw-primary"
          className="w-full mt-6"
          disabled={loading}
          style={{ fontSize: "var(--pw-text-md)" }}
        >
          {loading ? "送信中..." : "リセットリンクを送信"}
        </Button>

        <Link href="/auth/signin">
          <Button variant="pw-outline" className="w-full mt-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ログインページに戻る
          </Button>
        </Link>
      </form>
    </CenteredLayout>
  )
}

