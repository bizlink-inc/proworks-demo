"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>メールを送信しました</CardTitle>
            <CardDescription>
              {email} 宛に認証リンクを送信しました。
              <br />
              メール内のリンクをクリックして登録を完了してください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">次のステップ：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>受信トレイを確認</li>
                <li>メール内のリンクをクリック</li>
                <li>マイページでプロフィールを記入</li>
              </ol>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              メールが届かない場合は、迷惑メールフォルダをご確認ください。
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
          <CardTitle>新規登録</CardTitle>
          <CardDescription>
            メールアドレスを入力して登録を開始してください
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
              {loading ? "送信中..." : "認証メールを送信"}
            </Button>

            <p className="text-sm text-center text-gray-600">
              既にアカウントをお持ちの方は{" "}
            <Link href="/auth/signin" className="text-blue-600 hover:underline">
              ログイン
            </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
