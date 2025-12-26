"use client"

import type React from "react"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PWInput } from "@/components/ui/pw-input"
import { PWSelect } from "@/components/ui/pw-select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CenteredLayout } from "@/components/layouts"
import { PWAlert } from "@/components/ui/pw-alert"
import { useToast } from "@/hooks/use-toast"
import { Mail, Eye, EyeOff } from "lucide-react"

// パスワードバリデーション関数
const validatePassword = (password: string) => {
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  const typeCount = [hasUpperCase, hasLowerCase, hasNumber, hasSymbol].filter(Boolean).length
  const isLengthValid = password.length >= 8
  const isTypeValid = typeCount >= 1  // サインアップでは8文字以上で半角英数字記号

  return {
    isValid: isLengthValid,
    isLengthValid,
  }
}

// 生年月日用の選択肢を生成するユーティリティ
const generateYears = () => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  // 18歳以上〜100歳まで
  for (let year = currentYear - 18; year >= currentYear - 100; year--) {
    years.push(year)
  }
  return years
}

const generateMonths = () => {
  return Array.from({ length: 12 }, (_, i) => i + 1)
}

const generateDays = (year: string, month: string) => {
  if (!year || !month) {
    return Array.from({ length: 31 }, (_, i) => i + 1)
  }
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => i + 1)
}

export default function SignUpPage() {
  const { toast } = useToast()
  const [step, setStep] = useState<"form" | "email-sent">("form")
  const [loading, setLoading] = useState(false)

  // フォームの状態
  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [birthMonth, setBirthMonth] = useState("")
  const [birthDay, setBirthDay] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [receiveEmailDelivery, setReceiveEmailDelivery] = useState(true)
  const [termsAgreed, setTermsAgreed] = useState(false)

  // パスワードのリアルタイムバリデーション
  const passwordValidation = useMemo(() => {
    if (!password) {
      return { isValid: true, isLengthValid: true }
    }
    return validatePassword(password)
  }, [password])

  // パスワードが入力されていて、かつ無効な場合にエラー表示
  const showPasswordError = password.length > 0 && !passwordValidation.isValid

  // 生年月日の選択肢
  const years = useMemo(() => generateYears(), [])
  const months = useMemo(() => generateMonths(), [])
  const days = useMemo(() => generateDays(birthYear, birthMonth), [birthYear, birthMonth])

  // バリデーション
  const isFormValid = lastName && firstName && email && password && passwordValidation.isValid && phone && birthYear && birthMonth && birthDay && termsAgreed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!termsAgreed) {
      toast({
        title: "確認が必要です",
        description: "利用規約・個人情報取扱規約に同意してください。",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // 生年月日をフォーマット
      const birthDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`

      // メールアドレスでユーザー登録（追加情報も一緒に送信）
      const response = await fetch("/api/auth/signup-with-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          lastName,
          firstName,
          phone,
          birthDate,
          emailDeliveryStatus: receiveEmailDelivery ? "配信中" : "配信停止",
          termsAgreed: "同意済み",
        }),
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
      <CenteredLayout>
        <div className="text-center mb-6">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--pw-bg-light-blue)" }}
          >
            <Mail
              className="w-8 h-8"
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
            メールを送信しました
          </h1>
          <p
            className="text-[var(--pw-text-gray)]"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            ご登録ありがとうございます。
            <br />
            ご入力いただいたメールアドレス宛に確認メールを送信しました。
            <br />
            メールをご確認のうえ、マイページからプロフィールをご記入ください。
          </p>
        </div>

        <PWAlert variant="info" title="次のステップ：">
          <ol className="list-decimal list-inside space-y-1">
            <li>受信トレイを確認</li>
            <li>メール内のリンクをクリック</li>
            <li>マイページでプロフィールを記入</li>
          </ol>
        </PWAlert>

        <p
          className="text-center mt-4"
          style={{
            fontSize: "var(--pw-text-xs)",
            color: "var(--pw-text-light-gray)"
          }}
        >
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </p>
      </CenteredLayout>
    )
  }

  const policyLinks = (
    <div className="flex items-center justify-center gap-4">
      <Link
        href="/terms"
        className="hover:underline"
        style={{
          fontSize: "var(--pw-text-xs)",
          color: "var(--pw-text-gray)"
        }}
      >
        利用規約
      </Link>
      <Link
        href="/privacy"
        className="hover:underline"
        style={{
          fontSize: "var(--pw-text-xs)",
          color: "var(--pw-text-gray)"
        }}
      >
        プライバシーポリシー
      </Link>
      <Link
        href="/cookie"
        className="hover:underline"
        style={{
          fontSize: "var(--pw-text-xs)",
          color: "var(--pw-text-gray)"
        }}
      >
        クッキーポリシー
      </Link>
      <Link
        href="/news"
        className="hover:underline"
        style={{
          fontSize: "var(--pw-text-xs)",
          color: "var(--pw-text-gray)"
        }}
      >
        お知らせ
      </Link>
    </div>
  )

  return (
    <CenteredLayout showFooter={false} bottomContent={policyLinks}>
      <div className="text-center mb-8">
        <h1
          className="font-bold mb-2"
          style={{
            fontSize: "var(--pw-text-2xl)",
            color: "var(--pw-text-primary)",
            letterSpacing: "0.1em"
          }}
        >
          新規登録
        </h1>
        <p
          className="font-bold"
          style={{ 
            fontSize: "var(--pw-text-base)",
            color: "var(--pw-text-primary)"
          }}
        >
          無料でアカウントを作成できます
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* お名前 */}
        <div>
          <Label
            className="text-[var(--pw-text-primary)] mb-2 block font-bold"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            お名前
          </Label>
          <div className="flex gap-3">
            <PWInput
              type="text"
              placeholder="山田"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <PWInput
              type="text"
              placeholder="太郎"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
        </div>

        {/* メールアドレス */}
        <div>
          <Label
            htmlFor="email"
            className="text-[var(--pw-text-primary)] mb-2 block font-bold"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            メールアドレス
          </Label>
          <PWInput
            id="email"
            type="email"
            placeholder="メールアドレスを入力"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* パスワード */}
        <div>
          <Label
            htmlFor="password"
            className="text-[var(--pw-text-primary)] mb-2 block font-bold"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            パスワード
          </Label>
          <div className="relative">
            <PWInput
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
              style={{
                borderColor: showPasswordError ? "#dc2626" : undefined,
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: showPasswordError ? "#dc2626" : "var(--pw-button-primary)" }}
            >
              {showPassword ? (
                <Eye className="w-5 h-5" />
              ) : (
                <EyeOff className="w-5 h-5" />
              )}
            </button>
          </div>
          <p
            className="mt-1"
            style={{ 
              fontSize: "var(--pw-text-xs)", 
              color: showPasswordError ? "#dc2626" : "var(--pw-text-gray)" 
            }}
          >
            8文字以上、半角英数字・ハイフン・アンダーバーが使えます
          </p>
        </div>

        {/* 電話番号 */}
        <div>
          <Label
            htmlFor="phone"
            className="text-[var(--pw-text-primary)] mb-2 block font-bold"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            電話番号
          </Label>
          <PWInput
            id="phone"
            type="tel"
            placeholder="09011112222"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        {/* 生年月日 */}
        <div>
          <Label
            className="text-[var(--pw-text-primary)] mb-2 block font-bold"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            生年月日
          </Label>
          <div className="flex gap-3">
            <PWSelect
              id="birth-year"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            >
              <option value="">年</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </PWSelect>
            <PWSelect
              id="birth-month"
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
            >
              <option value="">月</option>
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </PWSelect>
            <PWSelect
              id="birth-day"
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
            >
              <option value="">日</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </PWSelect>
          </div>
        </div>

        {/* 新着案件・サービス情報を受け取る */}
        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="receive-email-delivery"
            checked={receiveEmailDelivery}
            onCheckedChange={(checked) => setReceiveEmailDelivery(checked === true)}
            className="data-[state=checked]:bg-[var(--pw-button-primary)] data-[state=checked]:border-[var(--pw-button-primary)]"
          />
          <Label
            htmlFor="receive-email-delivery"
            className="text-[var(--pw-text-primary)] cursor-pointer font-medium"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            新着案件・サービス情報を受け取る
          </Label>
        </div>

        {/* 利用規約・個人情報取扱規約 */}
        <div
          className="pt-4 pb-2"
          style={{ borderTop: "1px solid var(--pw-border-lighter)" }}
        >
          <p
            className="text-center mb-3"
            style={{
              fontSize: "var(--pw-text-sm)",
              color: "var(--pw-text-primary)"
            }}
          >
            <Link
              href="/terms"
              className="underline hover:no-underline"
              style={{ color: "var(--pw-text-link)" }}
            >
              利用規約
            </Link>
            ・
            <Link
              href="/privacy"
              className="underline hover:no-underline"
              style={{ color: "var(--pw-text-link)" }}
            >
              個人情報取扱規約
            </Link>
            を必ずご確認ください。
            <br />
            ご送信頂いた場合は、同意頂いたものとみなします。
          </p>
          <div className="flex items-center justify-center gap-2">
            <Checkbox
              id="terms-agreed"
              checked={termsAgreed}
              onCheckedChange={(checked) => setTermsAgreed(checked === true)}
              className="data-[state=checked]:bg-[var(--pw-button-primary)] data-[state=checked]:border-[var(--pw-button-primary)]"
            />
            <Label
              htmlFor="terms-agreed"
              className="text-[var(--pw-text-primary)] cursor-pointer"
              style={{ fontSize: "var(--pw-text-sm)" }}
            >
              利用規約・個人情報取扱規約に同意する
            </Label>
          </div>
        </div>

        {/* 登録ボタン */}
        <Button
          type="submit"
          variant="pw-primary"
          className="w-full mt-4"
          disabled={loading || !isFormValid}
          style={{ fontSize: "var(--pw-text-md)" }}
        >
          {loading ? "送信中..." : "内容を確認して登録する"}
        </Button>

        {/* ログインリンク */}
        <p
          className="text-center mt-4"
          style={{
            fontSize: "var(--pw-text-sm)",
            color: "var(--pw-text-gray)"
          }}
        >
          既にアカウントをお持ちの方はこちら{" "}
          <Link
            href="/auth/signin"
            className="font-medium underline hover:no-underline"
            style={{ color: "var(--pw-text-primary)" }}
          >
            ログイン
          </Link>
        </p>
      </form>
    </CenteredLayout>
  )
}
