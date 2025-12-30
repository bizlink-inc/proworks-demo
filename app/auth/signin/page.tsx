"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PWInput } from "@/components/ui/pw-input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
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
    <div className="min-h-screen flex flex-col bg-[var(--pw-bg-body)]">
      {/* ヘッダー */}
      <header
        className="bg-white py-3 px-6"
        style={{ borderBottom: "1px solid var(--pw-border-lighter)" }}
      >
        <div className="container mx-auto">
          <Link href="/landing">
            <Image
              src="/logo_proworks.svg"
              alt="PRO WORKS"
              width={150}
              height={24}
              priority
            />
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full" style={{ maxWidth: '520px' }}>
          {/* ログインカード */}
          <div
            className="bg-white rounded-[var(--pw-radius-md)] shadow-[0_0_0_1px_var(--pw-border-lighter)] p-8 sm:p-10"
            style={{
              boxShadow: '0 2px 8px var(--pw-shadow)',
            }}
          >
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
              {/* メールアドレス */}
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

              {/* パスワード */}
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
                <div className="mt-2 flex justify-between items-center">
                  <span
                    style={{
                      fontSize: "var(--pw-text-xs)",
                      color: "var(--pw-text-gray)"
                    }}
                  >
                    半角英数字記号8文字以上
                  </span>
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

              {/* ログイン状態を保持 */}
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="data-[state=checked]:bg-[var(--pw-button-primary)] data-[state=checked]:border-[var(--pw-button-primary)]"
                />
                <Label
                  htmlFor="remember-me"
                  className="text-[var(--pw-text-primary)] cursor-pointer"
                  style={{ fontSize: "var(--pw-text-sm)" }}
                >
                  ログイン状態を保持
                </Label>
              </div>

              {/* ログインボタン */}
          <Button
            type="submit"
            variant="pw-primary"
                className="w-full mt-4"
            disabled={loading}
            style={{ fontSize: "var(--pw-text-md)" }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </Button>
        </form>

            {/* 新規登録リンク */}
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
          </div>

          {/* フッターリンク（カードのすぐ下） */}
          <div className="mt-6 text-center">
            <div
              className="flex justify-center gap-4 flex-wrap"
              style={{
                fontSize: "var(--pw-text-sm)",
                color: "var(--pw-text-gray)"
              }}
            >
          <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
            利用規約
          </a>
          <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
            プライバシーポリシー
          </a>
          <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
                クッキーポリシー
          </a>
          <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
                お知らせ
          </a>
        </div>
      </div>
        </div>
      </main>
    </div>
  )
}
