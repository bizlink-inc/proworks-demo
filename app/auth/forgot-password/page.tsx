"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>メールを送信しました</CardTitle>
            <CardDescription>
              {email} 宛にパスワードリセット用のリンクを送信しました。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-4">
              <p className="font-semibold mb-1">次のステップ：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>受信トレイを確認</li>
                <li>メール内のリンクをクリック</li>
                <li>新しいパスワードを設定</li>
              </ol>
            </div>
            <p className="text-xs text-gray-500 text-center mb-4">
              メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </p>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                ログインページに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>パスワードをリセット</CardTitle>
          <CardDescription>
            登録済みのメールアドレスを入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
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
              className="w-full" 
              disabled={loading}
            >
              {loading ? "送信中..." : "リセットリンクを送信"}
            </Button>

            <Link href="/auth/signin">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                ログインページに戻る
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

