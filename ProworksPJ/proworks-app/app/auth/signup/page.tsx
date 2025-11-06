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
    lastNameKana: "",
    firstNameKana: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // モックなので、メール送信をシミュレート
    setStep("email-sent")

    toast({
      title: "確認メールを送信しました",
      description: `${formData.email} に確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。`,
    })
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastNameKana">セイ</Label>
                <Input
                  id="lastNameKana"
                  required
                  value={formData.lastNameKana}
                  onChange={(e) => setFormData({ ...formData, lastNameKana: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstNameKana">メイ</Label>
                <Input
                  id="firstNameKana"
                  required
                  value={formData.firstNameKana}
                  onChange={(e) => setFormData({ ...formData, firstNameKana: e.target.value })}
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
