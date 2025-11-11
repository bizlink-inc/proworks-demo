"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function VerifyEmailPage() {
  const router = useRouter()

  useEffect(() => {
    // Better Authが自動的にメール認証を処理し、ログイン状態になる
    // その後、/api/auth/callbackにリダイレクト
    const timer = setTimeout(() => {
      router.push("/api/auth/callback")
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <CardTitle>メール認証中...</CardTitle>
          <CardDescription>
            認証が完了しました。マイページへ移動しています...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">登録が完了しました！</p>
            <p className="text-xs">マイページでプロフィールを記入してください。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
