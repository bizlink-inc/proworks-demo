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
import { Mail } from "lucide-react"

export default function SignUpPage() {
  const { toast } = useToast()
  const [step, setStep] = useState<"form" | "email-sent">("form")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // メールアドレスのみでユーザー登録（ランダムパスワード自動生成）
      const response = await fetch("/api/auth/signup-with-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()

        let errorMessage = "ユーザー登録に失敗しました。"

        if (response.status === 400 || error.message?.includes("email")) {
          errorMessage = "このメールアドレスは既に登録されています。"
        } else if (error.message) {
          errorMessage = error.message
        }

        toast({
          title: "登録エラー",
          description: errorMessage,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // メール送信完了画面に遷移
      setStep("email-sent")
      setLoading(false)
    } catch (error) {
      toast({
        title: "エラー",
        description: "ユーザー登録に失敗しました。",
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
            {email} 宛に認証リンクを送信しました。
            <br />
            メール内のリンクをクリックして登録を完了してください。
          </p>
        </div>

        <PWAlert variant="info" title="次のステップ：">
          <ol className="list-decimal list-inside space-y-1">
            <li>受信トレイを確認</li>
            <li>メール内のリンクをクリック</li>
            <li>マイページでプロフィールを記入</li>
          </ol>
        </PWAlert>

        <p
          className="text-center mt-4"
          style={{
            fontSize: "var(--pw-text-xs)",
            color: "var(--pw-text-light-gray)"
          }}
        >
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
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
          PRO WORKS
        </h1>
        <p
          className="text-[var(--pw-text-gray)]"
          style={{ fontSize: "var(--pw-text-sm)" }}
        >
          新規登録
        </p>
        <p
          className="text-[var(--pw-text-gray)] mt-2"
          style={{ fontSize: "var(--pw-text-sm)" }}
        >
          メールアドレスを入力して登録を開始してください
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
          {loading ? "送信中..." : "認証メールを送信"}
        </Button>

        <p
          className="text-center mt-4"
          style={{
            fontSize: "var(--pw-text-sm)",
            color: "var(--pw-text-gray)"
          }}
        >
          既にアカウントをお持ちの方は{" "}
          <Link
            href="/auth/signin"
            className="hover:underline font-medium"
            style={{ color: "var(--pw-button-primary)" }}
          >
            ログイン
          </Link>
        </p>
      </form>
    </CenteredLayout>
  )
}
