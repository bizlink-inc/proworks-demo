"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { FormSection } from "@/components/ui/form-section"
import { PWInput } from "@/components/ui/pw-input"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEyeSlash, faEye } from "@fortawesome/free-solid-svg-icons"
import type { Talent } from "@/lib/kintone/types"
import { ContactDialog } from "@/components/contact-dialog"
import { WithdrawDialog } from "@/components/withdraw-dialog"
import { signOut } from "@/lib/auth-client"

interface SettingsFormProps {
  user: Talent | null
}

// パスワードバリデーション関数
const validatePassword = (password: string) => {
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  const typeCount = [hasUpperCase, hasLowerCase, hasNumber, hasSymbol].filter(Boolean).length
  const isLengthValid = password.length >= 12
  const isTypeValid = typeCount >= 3

  return {
    isValid: isLengthValid && isTypeValid,
    isLengthValid,
    isTypeValid,
    typeCount,
  }
}

// 水平線コンポーネント
const Divider = () => (
  <div
    className="w-full"
    style={{ borderTop: "1px solid var(--pw-border-light)", margin: "16px 0" }}
  />
)

export const SettingsForm = ({ user }: SettingsFormProps) => {
  const { toast } = useToast()
  const router = useRouter()

  // メールアドレス関連
  const [emailData, setEmailData] = useState({
    email: user?.email || "",
    emailDeliveryStatus: user?.emailDeliveryStatus === "配信停止" ? "stop" : "receive",
  })
  const [emailLoading, setEmailLoading] = useState(false)

  // パスワード関連
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // ダイアログ関連
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false)

  // 新しいパスワードのリアルタイムバリデーション
  const passwordValidation = useMemo(() => {
    if (!passwordData.newPassword) {
      return { isValid: true, isLengthValid: true, isTypeValid: true, typeCount: 0 }
    }
    return validatePassword(passwordData.newPassword)
  }, [passwordData.newPassword])

  // パスワードが入力されていて、かつ無効な場合にエラー表示
  const showPasswordError = passwordData.newPassword.length > 0 && !passwordValidation.isValid

  // メールアドレス変更
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailData.email)) {
      toast({
        title: "エラー",
        description: "有効なメールアドレスを入力してください。",
        variant: "destructive",
      })
      return
    }

    setEmailLoading(true)

    try {
      // メール配信設定を更新
      const deliveryStatus = emailData.emailDeliveryStatus === "receive" ? "配信中" : "配信停止"
      
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailDeliveryStatus: deliveryStatus,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "更新に失敗しました。")
      }

      toast({
        title: "更新完了",
        description: "メール配信設定が更新されました。",
      })
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "更新に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setEmailLoading(false)
    }
  }

  // パスワード変更
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // パスワードバリデーション（12文字以上、大文字・小文字・数字・記号のうち3種類以上）
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword)
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword)
    const hasNumber = /[0-9]/.test(passwordData.newPassword)
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword)
    const typeCount = [hasUpperCase, hasLowerCase, hasNumber, hasSymbol].filter(Boolean).length

    if (passwordData.newPassword.length < 12) {
      toast({
        title: "エラー",
        description: "パスワードは12文字以上で入力してください。",
        variant: "destructive",
      })
      return
    }

    if (typeCount < 3) {
      toast({
        title: "エラー",
        description: "パスワードは大文字・小文字・数字・記号のうち3種類以上を含めてください。",
        variant: "destructive",
      })
      return
    }

    setPasswordLoading(true)

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.message || "パスワード変更に失敗しました。")
      }

      toast({
        title: "パスワードの変更が完了しました。",
        description: "セキュリティのため、再度ログインしてください。",
      })

      // セキュリティのため、パスワード変更後はログアウトしてログイン画面へリダイレクト
      await signOut()
      router.push("/auth/signin")
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "パスワード変更に失敗しました。",
        variant: "destructive",
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* メールアドレスセクション */}
      <FormSection title="メールアドレス">
        <form onSubmit={handleEmailSubmit}>
          <Divider />
          
          <div className="py-4">
            <div className="flex items-center gap-8">
              <Label
                htmlFor="email"
                className="w-32 flex-shrink-0"
                style={{ color: "var(--pw-text-primary)" }}
              >
                メールアドレス
              </Label>
              <PWInput
                id="email"
                type="email"
                placeholder="メールアドレスを入力"
                value={emailData.email}
                onChange={(e) => setEmailData({ ...emailData, email: e.target.value })}
                className="flex-1"
                style={{ maxWidth: "400px" }}
              />
            </div>
          </div>

          <div className="py-4">
            <div className="flex items-center gap-8">
              <Label
                className="w-32 flex-shrink-0"
                style={{ color: "var(--pw-text-primary)" }}
              >
                メール配信設定
              </Label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span
                    className="w-5 h-5 rounded-full border flex items-center justify-center"
                    style={{
                      borderColor: "var(--pw-border-gray)",
                      backgroundColor: "transparent",
                    }}
                  >
                    {emailData.emailDeliveryStatus === "receive" && (
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: "var(--pw-button-primary)" }}
                      />
                    )}
                  </span>
                  <input
                    type="radio"
                    name="emailDeliveryStatus"
                    value="receive"
                    checked={emailData.emailDeliveryStatus === "receive"}
                    onChange={(e) => setEmailData({ ...emailData, emailDeliveryStatus: e.target.value })}
                    className="sr-only"
                  />
                  <span style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}>
                    受信する
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span
                    className="w-5 h-5 rounded-full border flex items-center justify-center"
                    style={{
                      borderColor: "var(--pw-border-gray)",
                      backgroundColor: "transparent",
                    }}
                  >
                    {emailData.emailDeliveryStatus === "stop" && (
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: "var(--pw-button-primary)" }}
                      />
                    )}
                  </span>
                  <input
                    type="radio"
                    name="emailDeliveryStatus"
                    value="stop"
                    checked={emailData.emailDeliveryStatus === "stop"}
                    onChange={(e) => setEmailData({ ...emailData, emailDeliveryStatus: e.target.value })}
                    className="sr-only"
                  />
                  <span style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}>
                    停止する
                  </span>
                </label>
              </div>
            </div>
          </div>

          <Divider />

          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              variant="pw-primary"
              disabled={emailLoading}
              style={{ fontSize: "var(--pw-text-md)", minWidth: "280px" }}
            >
              {emailLoading ? "更新中..." : "メールアドレスを変更する"}
            </Button>
          </div>
        </form>
      </FormSection>

      {/* パスワードセクション */}
      <FormSection title="パスワード">
        <form onSubmit={handlePasswordSubmit}>
          <Divider />
          
          <div className="py-4">
            <div className="flex items-center gap-4">
              <Label
                htmlFor="currentPassword"
                className="w-36 flex-shrink-0"
                style={{ color: "var(--pw-text-primary)" }}
              >
                現在のパスワード
              </Label>
              <div className="relative flex-1 min-w-0">
                <PWInput
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder=""
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="pr-10 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--pw-button-primary)" }}
                >
                  <FontAwesomeIcon icon={showCurrentPassword ? faEye : faEyeSlash} className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="py-4">
            <div className="flex items-center gap-4">
              <Label
                htmlFor="newPassword"
                className="w-36 flex-shrink-0"
                style={{ color: "var(--pw-text-primary)" }}
              >
                新しいパスワード
              </Label>
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <PWInput
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder=""
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="pr-10 w-full"
                    style={{
                      borderColor: showPasswordError ? "#dc2626" : undefined,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--pw-button-primary)" }}
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEye : faEyeSlash} className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <p
              className="mt-2 ml-40"
              style={{ 
                fontSize: "var(--pw-text-xs)", 
                color: showPasswordError ? "#dc2626" : "var(--pw-text-gray)" 
              }}
            >
              ※12文字以上で、英大文字・小文字・数字・記号のうち3種類以上を含めてください。
            </p>
          </div>

          <Divider />

          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              variant="pw-primary"
              disabled={passwordLoading}
              style={{ fontSize: "var(--pw-text-md)", minWidth: "280px" }}
            >
              {passwordLoading ? "変更中..." : "パスワードを変更する"}
            </Button>
          </div>
        </form>
      </FormSection>

      {/* お問い合わせセクション */}
      <FormSection title="お問い合わせ">
        <div>
          <Divider />

          <div className="flex justify-center py-4">
            <p
              className="text-left"
              style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}
            >
              気になることがあれば、どんなことでもお気軽にお問い合わせください。<br />
              担当スタッフがご対応いたします。
            </p>
          </div>

          <Divider />

          <div className="flex justify-center pt-4">
            <Button
              type="button"
              variant="pw-primary"
              style={{ fontSize: "var(--pw-text-md)", minWidth: "280px" }}
              onClick={() => setContactDialogOpen(true)}
            >
              お問い合わせをする
            </Button>
          </div>
        </div>
      </FormSection>

      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
      />

      {/* 退会セクション */}
      <FormSection title="退会">
        <div>
          <Divider />

          <div className="flex justify-center py-4">
            <p
              className="text-left"
              style={{ fontSize: "var(--pw-text-sm)", color: "var(--pw-text-primary)" }}
            >
              退会を行うと、これまでの登録内容・応募履歴などのデータはすべて削除されます。<br />
              削除後は元に戻すことができません。<br />
              よろしければ「退会の申請をする」ボタンを押してください
            </p>
          </div>

          <Divider />

          <div className="flex justify-center pt-4">
            <Button
              type="button"
              variant="pw-primary"
              style={{ fontSize: "var(--pw-text-md)", minWidth: "280px" }}
              onClick={() => setWithdrawDialogOpen(true)}
            >
              退会の申請をする
            </Button>
          </div>
        </div>
      </FormSection>

      <WithdrawDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
      />
    </div>
  )
}
