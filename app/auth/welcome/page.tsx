"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Sparkles, ArrowRight, FileText } from "lucide-react"

type StepId = "skills" | "experience"

export default function WelcomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState<StepId>("skills")
  const [profileData, setProfileData] = useState<any>(null)

  // フォームデータ
  const [formData, setFormData] = useState({
    skills: "",
    experience: "",
  })

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      const res = await fetch("/api/me")
      if (res.ok) {
        const data = await res.json()
        setProfileData(data)
        setFormData({
          skills: data.skills || "",
          experience: data.experience || "",
        })
      }
    } catch (error) {
      console.error("プロフィールデータの取得に失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveCurrentStep = async () => {
    setSaving(true)
    try {
      const dataToSave = currentStep === "skills" 
        ? { skills: formData.skills }
        : { experience: formData.experience }

      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      })

      if (!res.ok) {
        throw new Error("保存に失敗しました")
      }

      return true
    } catch (error) {
      toast({
        title: "エラー",
        description: "データの保存に失敗しました。",
        variant: "destructive",
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    if (currentStep === "skills") {
      if (formData.skills.trim()) {
        const success = await saveCurrentStep()
        if (success) {
          setCurrentStep("experience")
        }
      } else {
        setCurrentStep("experience")
      }
    }
  }

  const handleComplete = async () => {
    if (formData.experience.trim()) {
      const success = await saveCurrentStep()
      if (success) {
        toast({
          title: "保存しました",
          description: "プロフィールを登録しました。",
        })
        router.push("/me")
      }
    } else {
      router.push("/me")
    }
  }

  const handleSkip = () => {
    router.push("/me")
  }

  const handleSkipToNext = () => {
    setCurrentStep("experience")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--pw-bg-light)" }}>
        <div className="animate-pulse text-center">
          <p style={{ color: "var(--pw-text-gray)" }}>読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--pw-bg-light)" }}>
      {/* ヘッダー */}
      <header
        className="py-3 px-4"
        style={{ backgroundColor: "var(--pw-bg-white)", borderBottom: "1px solid var(--pw-border-lighter)" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="font-bold text-lg" style={{ color: "var(--pw-text-navy)" }}>
            PRO WORKS
          </h1>
          {/* ステップ表示 */}
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === "skills" ? "text-white" : "text-white"
              }`}
              style={{
                backgroundColor: "var(--pw-button-primary)",
              }}
            >
              1
            </span>
            <span className="text-xs" style={{ color: "var(--pw-text-gray)" }}>→</span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                currentStep === "experience" ? "text-white" : ""
              }`}
              style={{
                backgroundColor: currentStep === "experience" ? "var(--pw-button-primary)" : "var(--pw-border-gray)",
                color: currentStep === "experience" ? "white" : "var(--pw-text-gray)",
              }}
            >
              2
            </span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg">
          {/* 完了メッセージ（コンパクト） */}
          <div
            className="rounded-lg p-3 mb-4 flex items-center gap-3"
            style={{ backgroundColor: "#e8f5f0", border: "1px solid var(--pw-alert-success)" }}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--pw-alert-success)" }} />
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--pw-alert-success)" }}>
                基本情報の登録が完了しました
              </p>
              {(profileData?.lastName || profileData?.firstName) && (
                <p className="text-xs" style={{ color: "var(--pw-text-gray)" }}>
                  {profileData?.lastName} {profileData?.firstName} さん
                </p>
              )}
            </div>
          </div>

          {/* ステップ1: スキル入力 */}
          {currentStep === "skills" && (
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: "var(--pw-bg-white)", border: "1px solid var(--pw-border-lighter)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5" style={{ color: "var(--pw-button-primary)" }} />
                <h2 className="font-bold" style={{ fontSize: "18px", color: "var(--pw-text-primary)" }}>
                  スキル・経験を追加しませんか？
                </h2>
              </div>

              {/* マッチ率メッセージ */}
              <div
                className="rounded-lg p-3 mb-4"
                style={{ backgroundColor: "var(--pw-bg-light-blue)" }}
              >
                <p className="text-sm" style={{ color: "var(--pw-button-primary)" }}>
                  💡 スキルを入力すると<strong>マッチ率が約30%向上</strong>します！<br />
                  あなたに合った案件が優先的に表示されるようになります。
                </p>
              </div>

              <div className="mb-4">
                <Label
                  htmlFor="skills"
                  className="block mb-2 font-medium text-sm"
                  style={{ color: "var(--pw-text-primary)" }}
                >
                  使用経験のある言語・ツール
                </Label>
                <Textarea
                  id="skills"
                  placeholder="例: JavaScript, TypeScript, React, Next.js, Python, AWS, Docker など"
                  rows={3}
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  style={{ fontSize: "14px" }}
                />
                <p className="mt-1 text-xs" style={{ color: "var(--pw-text-gray)" }}>
                  カンマ区切りで入力
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="pw-primary"
                  onClick={handleNext}
                  disabled={saving}
                  className="w-full"
                  style={{ fontSize: "15px" }}
                >
                  {saving ? "保存中..." : formData.skills.trim() ? "保存して次へ" : "次へ"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <button
                  onClick={handleSkip}
                  className="text-center text-sm underline py-2"
                  style={{ color: "var(--pw-text-gray)" }}
                >
                  後で入力する（マイページへ）
                </button>
              </div>
            </div>
          )}

          {/* ステップ2: 実績・職歴入力 */}
          {currentStep === "experience" && (
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: "var(--pw-bg-white)", border: "1px solid var(--pw-border-lighter)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5" style={{ color: "var(--pw-button-primary)" }} />
                <h2 className="font-bold" style={{ fontSize: "18px", color: "var(--pw-text-primary)" }}>
                  実績・職歴を追加しませんか？
                </h2>
              </div>

              {/* マッチ率メッセージ */}
              <div
                className="rounded-lg p-3 mb-4"
                style={{ backgroundColor: "var(--pw-bg-light-blue)" }}
              >
                <p className="text-sm" style={{ color: "var(--pw-button-primary)" }}>
                  💡 実績を入力すると<strong>企業からのスカウト率がアップ</strong>！<br />
                  より条件の良い案件とマッチングしやすくなります。
                </p>
              </div>

              <div className="mb-4">
                <Label
                  htmlFor="experience"
                  className="block mb-2 font-medium text-sm"
                  style={{ color: "var(--pw-text-primary)" }}
                >
                  主な実績・PR・職務経歴
                </Label>
                <Textarea
                  id="experience"
                  placeholder="例: 
・ECサイトのフルリニューアル（Next.js, TypeScript）
・大規模基幹システムの保守開発（Java, Spring Boot）
・スマホアプリ開発リーダー経験（React Native）"
                  rows={5}
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  style={{ fontSize: "14px" }}
                />
                <p className="mt-1 text-xs" style={{ color: "var(--pw-text-gray)" }}>
                  箇条書きで主な実績を入力
                </p>
              </div>

              <Button
                variant="pw-primary"
                onClick={handleComplete}
                disabled={saving}
                className="w-full"
                style={{ fontSize: "15px" }}
              >
                {saving ? "保存中..." : "完了してマイページへ"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {/* 補足メッセージ */}
          <p className="text-center mt-4 text-xs" style={{ color: "var(--pw-text-gray)" }}>
            マイページでいつでも編集・追加できます
          </p>
        </div>
      </main>
    </div>
  )
}
