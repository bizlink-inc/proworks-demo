"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PWInput } from "@/components/ui/pw-input"
import { Label } from "@/components/ui/label"
import { CenteredLayout } from "@/components/layouts"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"

const ResetPasswordContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (!tokenParam) {
      toast({
        title: "エラー",
        description: "無効なリセットリンクです。",
        variant: "destructive",
      })
      router.push("/auth/forgot-password")
    } else {
      setToken(tokenParam)
    }
  }, [searchParams, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "エラー",
        description: "パスワードが一致しません。",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "エラー",
        description: "パスワードは6文字以上である必要があります。",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast({
          title: "エラー",
          description: error.message || "パスワードのリセットに失敗しました。",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      setSuccess(true)
      toast({
        title: "成功",
        description: "パスワードがリセットされました。",
      })

      // 3秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push("/auth/signin")
      }, 3000)
    } catch (error) {
      toast({
        title: "エラー",
        description: "パスワードのリセットに失敗しました。",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  if (success) {
    return (
      <CenteredLayout>
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
          <h1
            className="font-semibold mb-2"
            style={{
              fontSize: "var(--pw-text-xl)",
              color: "var(--pw-text-primary)"
            }}
          >
            パスワードをリセットしました
          </h1>
          <p
            className="text-[var(--pw-text-gray)] mb-6"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            新しいパスワードでログインできます
          </p>
          <p
            className="text-center"
            style={{
              fontSize: "var(--pw-text-sm)",
              color: "var(--pw-text-gray)"
            }}
          >
            3秒後にログインページへ移動します...
          </p>
        </div>
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
          新しいパスワードを設定
        </h1>
        <p
          className="text-[var(--pw-text-gray)]"
          style={{ fontSize: "var(--pw-text-sm)" }}
        >
          新しいパスワードを入力してください
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label
            htmlFor="password"
            className="text-[var(--pw-text-primary)] mb-1 block"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            新しいパスワード
          </Label>
          <PWInput
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <p
            className="mt-1"
            style={{
              fontSize: "var(--pw-text-xs)",
              color: "var(--pw-text-light-gray)"
            }}
          >
            6文字以上で入力してください
          </p>
        </div>

        <div>
          <Label
            htmlFor="confirmPassword"
            className="text-[var(--pw-text-primary)] mb-1 block"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            パスワードを再入力
          </Label>
          <PWInput
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <Button
          type="submit"
          variant="pw-primary"
          className="w-full mt-6"
          disabled={loading || !token}
          style={{ fontSize: "var(--pw-text-md)" }}
        >
          {loading ? "リセット中..." : "パスワードをリセット"}
        </Button>
      </form>
    </CenteredLayout>
  )
}

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={
      <CenteredLayout>
        <div className="text-center">
          <p>読み込み中...</p>
        </div>
      </CenteredLayout>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

export default ResetPasswordPage
