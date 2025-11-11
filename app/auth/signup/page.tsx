"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function SignUpPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState<"form" | "email-sent">("form")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    lastName: "",
    firstName: "",
    phone: "",
    birthDate: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const name = `${formData.lastName} ${formData.firstName}`

    try {
      // Better Authでユーザー登録
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        
        // エラーメッセージを判定
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
        return
      }

      const authData = await response.json()

      // kintoneに人材情報を登録
      const kintoneResponse = await fetch("/api/talents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authUserId: authData.user.id,
          lastName: formData.lastName,
          firstName: formData.firstName,
          email: formData.email,
          phone: formData.phone,
          birthDate: formData.birthDate,
        }),
      })

      if (!kintoneResponse.ok) {
        console.error("kintoneへの登録に失敗しました")
      }

      // 登録成功 - ログインページにリダイレクト
      toast({
        title: "登録完了",
        description: "アカウントが作成されました。ログインしてください。",
      })

      router.push("/auth/signin")
    } catch (error) {
      toast({
        title: "エラー",
        description: "ユーザー登録に失敗しました。",
        variant: "destructive",
      })
    }
  }

  if (step === "email-sent") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">メール送信完了</CardTitle>
            <CardDescription>確認メールを送信しました</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-700 mb-2">
                <strong>{formData.email}</strong> に確認メールを送信しました。
              </p>
              <p className="text-sm text-gray-600">メール内のリンクをクリックして、登録を完了してください。</p>
            </div>
            <div className="text-center text-sm text-gray-600">
              <p>メールが届かない場合は、迷惑メールフォルダをご確認ください。</p>
            </div>
            <div className="pt-4">
              <Link href="/auth/signin" className="block">
                <Button className="w-full">ログインページへ</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/landing" className="text-2xl font-bold text-blue-600 mb-4 block">
            PRO WORKS
          </Link>
          <CardTitle className="text-2xl">新規登録</CardTitle>
          <CardDescription>アカウントを作成して、案件を探しましょう</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">姓</Label>
                <Input
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">名</Label>
                <Input
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <p className="text-xs text-gray-500">6文字以上で入力してください</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                required
                placeholder="090-1234-5678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">生年月日</Label>
              <Input
                id="birthDate"
                type="date"
                required
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>

            <Button type="submit" className="w-full">
              登録する
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">すでにアカウントをお持ちですか？ </span>
            <Link href="/auth/signin" className="text-blue-600 hover:underline">
              ログイン
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
