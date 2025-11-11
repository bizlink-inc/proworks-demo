"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>パスワードをリセットしました</CardTitle>
            <CardDescription>
              新しいパスワードでログインできます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-gray-600">
              3秒後にログインページへ移動します...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>新しいパスワードを設定</CardTitle>
          <CardDescription>
            新しいパスワードを入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">新しいパスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                6文字以上で入力してください
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">パスワードを再入力</Label>
              <Input
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
              className="w-full" 
              disabled={loading || !token}
            >
              {loading ? "リセット中..." : "パスワードをリセット"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

