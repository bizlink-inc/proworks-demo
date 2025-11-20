"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CenteredLayout } from "@/components/layouts"
import { PWAlert } from "@/components/ui/pw-alert"
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
    <CenteredLayout>
      <div className="text-center mb-6">
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: "var(--pw-bg-light-blue)" }}
        >
          <Loader2
            className="w-8 h-8 animate-spin"
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
          メール認証中...
        </h1>
        <p
          className="text-[var(--pw-text-gray)]"
          style={{ fontSize: "var(--pw-text-sm)" }}
        >
          認証が完了しました。マイページへ移動しています...
        </p>
      </div>

      <PWAlert variant="success" title="登録が完了しました！">
        <p style={{ fontSize: "var(--pw-text-xs)" }}>
          マイページでプロフィールを記入してください。
        </p>
      </PWAlert>
    </CenteredLayout>
  )
}
