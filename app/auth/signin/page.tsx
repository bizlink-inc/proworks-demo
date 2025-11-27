"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PWInput } from "@/components/ui/pw-input"
import { CenteredLayout } from "@/components/layouts"
import { useToast } from "@/hooks/use-toast"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // ローカル環境用のカスタム認証エンドポイントを使用
      const response = await fetch("/api/auth/sign-in-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "ログイン失敗",
          description: error.message || "メールアドレスまたはパスワードが正しくありません。",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // ログイン成功
      toast({
        title: "ログイン成功",
        description: "ダッシュボードにリダイレクトしています...",
      })

      router.push("/")
      router.refresh()
    } catch (error) {
      toast({
        title: "エラー",
        description: "ログインに失敗しました。",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <>
      <CenteredLayout showHeader={true} showFooter={false}>
        <div className="text-center mb-8">
          <h1
            className="font-semibold"
            style={{
              fontSize: "var(--pw-text-2xl)",
              color: "var(--pw-text-primary)"
            }}
          >
            ログイン
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <PWInput
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="s_aieda@wag-wag.net"
              leftIcon={<Mail className="w-5 h-5" />}
            />
          </div>

          <div>
            <PWInput
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
            />
            <div className="mt-2 text-right">
              <Link
                href="/auth/forgot-password"
                className="hover:underline"
                style={{
                  fontSize: "var(--pw-text-xs)",
                  color: "var(--pw-button-primary)"
                }}
              >
                パスワードを忘れた方
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="pw-primary"
            className="w-full mt-6"
            disabled={loading}
            style={{ fontSize: "var(--pw-text-md)" }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p
            className="text-[var(--pw-text-gray)]"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            PRO WORKSのご利用は初めてですか？
            <Link
              href="/auth/signup"
              className="ml-1 font-semibold hover:underline"
              style={{ color: "var(--pw-text-black)" }}
            >
              新規登録（無料）
            </Link>
          </p>
        </div>
      </CenteredLayout>

      <div className="text-center pb-8">
        <div className="flex justify-center gap-4 text-[var(--pw-text-sm)] text-[var(--pw-text-gray)]">
          <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
            利用規約
          </a>
          <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
            プライバシーポリシー
          </a>
          <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
            ヘルプ
          </a>
          <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
            お問い合わせ
          </a>
        </div>
      </div>
    </>
  )
}
