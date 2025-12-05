"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, User, Briefcase, Settings, ArrowRight, ArrowLeft, Sparkles } from "lucide-react"
import { DROPDOWN_OPTIONS } from "@/lib/kintone/fieldMapping"

type StepId = "intro" | "skills" | "preferences" | "complete"

export default function WelcomePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentStep, setCurrentStep] = useState<StepId>("intro")
  const [profileData, setProfileData] = useState<any>(null)

  // フォームデータ
  const [formData, setFormData] = useState({
    // 職歴・スキル（パパッと入れられるもの）
    skills: "",
    // 希望条件（パパッと入れられるもの）
    availableFrom: "",
    desiredWorkDays: "",
    desiredWorkHours: "",
    desiredWorkStyle: [] as string[],
    desiredRate: "",
  })

  const workStyleOptions = ["リモート", "ハイブリッド", "常駐"]

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      const res = await fetch("/api/me")
      if (res.ok) {
        const data = await res.json()
        setProfileData(data)
        // 既存データをフォームに反映
        setFormData({
          skills: data.skills || "",
          availableFrom: data.availableFrom || "",
          desiredWorkDays: data.desiredWorkDays || "",
          desiredWorkHours: data.desiredWorkHours || "",
          desiredWorkStyle: data.desiredWorkStyle || [],
          desiredRate: data.desiredRate || "",
        })
      }
    } catch (error) {
      console.error("プロフィールデータの取得に失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkStyle = (style: string) => {
    setFormData((prev) => ({
      ...prev,
      desiredWorkStyle: prev.desiredWorkStyle.includes(style)
        ? prev.desiredWorkStyle.filter((s) => s !== style)
        : [...prev.desiredWorkStyle, style],
    }))
  }

  const saveFormData = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      const success = await saveFormData()
      if (success) {
        setCurrentStep("preferences")
      }
    } else if (currentStep === "preferences") {
      const success = await saveFormData()
      if (success) {
        setCurrentStep("complete")
      }
    } else if (currentStep === "intro") {
      setCurrentStep("skills")
    }
  }

  const handleBack = () => {
    if (currentStep === "skills") {
      setCurrentStep("intro")
    } else if (currentStep === "preferences") {
      setCurrentStep("skills")
    } else if (currentStep === "complete") {
      setCurrentStep("preferences")
    }
  }

  const handleSkip = () => {
    if (currentStep === "skills") {
      setCurrentStep("preferences")
    } else if (currentStep === "preferences") {
      setCurrentStep("complete")
    }
  }

  const handleFinish = () => {
    router.push("/jobs")
  }

  const handleGoToMyPage = () => {
    router.push("/me")
  }

  // 進捗計算
  const getProgress = () => {
    const steps = ["intro", "skills", "preferences", "complete"]
    const currentIndex = steps.indexOf(currentStep)
    return Math.round((currentIndex / (steps.length - 1)) * 100)
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
    <div className="min-h-screen" style={{ backgroundColor: "var(--pw-bg-light)" }}>
      {/* ヘッダー */}
      <header
        className="py-4 px-6"
        style={{ backgroundColor: "var(--pw-bg-white)", borderBottom: "1px solid var(--pw-border-lighter)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-xl" style={{ color: "var(--pw-text-navy)" }}>
            PRO WORKS
          </h1>
          {currentStep !== "complete" && (
            <Button
              variant="ghost"
              onClick={handleFinish}
              style={{ color: "var(--pw-text-gray)" }}
            >
              後で入力する
            </Button>
          )}
        </div>
      </header>

      {/* 進捗バー */}
      <div
        className="py-4 px-6"
        style={{ backgroundColor: "var(--pw-bg-white)", borderBottom: "1px solid var(--pw-border-lighter)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: "var(--pw-text-gray)" }}>
              プロフィール設定
            </span>
            <span className="text-sm font-medium" style={{ color: "var(--pw-button-primary)" }}>
              {getProgress()}%
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--pw-bg-light)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${getProgress()}%`,
                backgroundColor: "var(--pw-button-primary)",
              }}
            />
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* イントロステップ */}
        {currentStep === "intro" && (
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
              style={{ backgroundColor: "#e8f5f0" }}
            >
              <Sparkles className="w-10 h-10" style={{ color: "var(--pw-alert-success)" }} />
            </div>
            <h2
              className="font-bold mb-3"
              style={{ fontSize: "var(--pw-text-2xl)", color: "var(--pw-text-primary)" }}
            >
              ようこそ、PRO WORKS へ！
            </h2>
            <p className="mb-8" style={{ fontSize: "var(--pw-text-base)", color: "var(--pw-text-gray)" }}>
              あと少しで準備完了です。<br />
              <span style={{ color: "var(--pw-button-primary)", fontWeight: "bold" }}>2つの簡単なステップ</span>を完了すると、<br />
              あなたにぴったりの案件が見つかりやすくなります。
            </p>

            {/* 基本情報完了 */}
            <div
              className="rounded-xl p-4 mb-6 text-left flex items-center gap-4"
              style={{ backgroundColor: "#e8f5f0", border: "2px solid var(--pw-alert-success)" }}
            >
              <CheckCircle className="w-8 h-8 flex-shrink-0" style={{ color: "var(--pw-alert-success)" }} />
              <div>
                <p className="font-semibold" style={{ color: "var(--pw-alert-success)" }}>
                  ✓ 基本情報の登録が完了しました
                </p>
                <p className="text-sm" style={{ color: "var(--pw-text-gray)" }}>
                  {profileData?.lastName} {profileData?.firstName} さん
                </p>
              </div>
            </div>

            {/* これからやること */}
            <div
              className="rounded-xl p-6 mb-8 text-left"
              style={{ backgroundColor: "var(--pw-bg-white)", border: "1px solid var(--pw-border-lighter)" }}
            >
              <p className="font-medium mb-4" style={{ color: "var(--pw-text-primary)" }}>
                これから入力するもの：
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--pw-bg-light-blue)" }}
                  >
                    <Briefcase className="w-4 h-4" style={{ color: "var(--pw-button-primary)" }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: "var(--pw-text-primary)" }}>スキル・経験</p>
                    <p className="text-sm" style={{ color: "var(--pw-text-gray)" }}>使用言語やツールなど（1分）</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--pw-bg-light-blue)" }}
                  >
                    <Settings className="w-4 h-4" style={{ color: "var(--pw-button-primary)" }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: "var(--pw-text-primary)" }}>希望条件</p>
                    <p className="text-sm" style={{ color: "var(--pw-text-gray)" }}>勤務日数・稼働時期など（1分）</p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="pw-primary"
              size="lg"
              onClick={handleNext}
              className="w-full"
              style={{ fontSize: "var(--pw-text-lg)" }}
            >
              はじめる
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}

        {/* スキル入力ステップ */}
        {currentStep === "skills" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--pw-bg-light-blue)" }}
              >
                <Briefcase className="w-5 h-5" style={{ color: "var(--pw-button-primary)" }} />
              </div>
              <div>
                <h2 className="font-bold" style={{ fontSize: "var(--pw-text-xl)", color: "var(--pw-text-primary)" }}>
                  スキル・経験
                </h2>
                <p className="text-sm" style={{ color: "var(--pw-text-gray)" }}>
                  使用経験のある言語やツールを教えてください
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-6 mb-6"
              style={{ backgroundColor: "var(--pw-bg-white)", border: "1px solid var(--pw-border-lighter)" }}
            >
              <Label
                htmlFor="skills"
                className="block mb-2 font-medium"
                style={{ color: "var(--pw-text-primary)" }}
              >
                言語・ツールの経験
              </Label>
              <Textarea
                id="skills"
                placeholder="例: JavaScript, TypeScript, React, Next.js, Python, AWS, Docker など"
                rows={4}
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                style={{ fontSize: "var(--pw-text-base)" }}
              />
              <p className="mt-2 text-sm" style={{ color: "var(--pw-text-gray)" }}>
                カンマ区切りで入力してください。詳しい経歴は後からマイページで追加できます。
              </p>
            </div>

            <div
              className="rounded-xl p-4 mb-8"
              style={{ backgroundColor: "var(--pw-bg-light-blue)" }}
            >
              <p className="text-sm" style={{ color: "var(--pw-button-primary)" }}>
                💡 スキルを入力すると、あなたに合った案件が<strong>優先的に表示</strong>されます
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                戻る
              </Button>
              <Button
                variant="pw-primary"
                size="lg"
                onClick={handleNext}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "保存中..." : "次へ"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <button
              onClick={handleSkip}
              className="w-full mt-4 text-center text-sm underline"
              style={{ color: "var(--pw-text-gray)" }}
            >
              スキップして次へ
            </button>
          </div>
        )}

        {/* 希望条件入力ステップ */}
        {currentStep === "preferences" && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--pw-bg-light-blue)" }}
              >
                <Settings className="w-5 h-5" style={{ color: "var(--pw-button-primary)" }} />
              </div>
              <div>
                <h2 className="font-bold" style={{ fontSize: "var(--pw-text-xl)", color: "var(--pw-text-primary)" }}>
                  希望条件
                </h2>
                <p className="text-sm" style={{ color: "var(--pw-text-gray)" }}>
                  あなたの希望する働き方を教えてください
                </p>
              </div>
            </div>

            <div
              className="rounded-xl p-6 mb-6 space-y-6"
              style={{ backgroundColor: "var(--pw-bg-white)", border: "1px solid var(--pw-border-lighter)" }}
            >
              {/* 稼働可能時期 */}
              <div>
                <Label
                  htmlFor="availableFrom"
                  className="block mb-2 font-medium"
                  style={{ color: "var(--pw-text-primary)" }}
                >
                  稼働可能時期
                </Label>
                <Input
                  id="availableFrom"
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                />
                <p className="mt-1 text-sm" style={{ color: "var(--pw-text-gray)" }}>
                  すぐに稼働可能な場合は今日の日付を選択
                </p>
              </div>

              {/* 希望勤務日数 */}
              <div>
                <Label
                  htmlFor="desiredWorkDays"
                  className="block mb-2 font-medium"
                  style={{ color: "var(--pw-text-primary)" }}
                >
                  希望勤務日数
                </Label>
                <select
                  id="desiredWorkDays"
                  value={formData.desiredWorkDays}
                  onChange={(e) => setFormData({ ...formData, desiredWorkDays: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  style={{ borderColor: "var(--pw-border-gray)", fontSize: "var(--pw-text-base)" }}
                >
                  <option value="">選択してください</option>
                  {DROPDOWN_OPTIONS.DESIRED_WORK_DAYS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* 希望作業時間 */}
              <div>
                <Label
                  htmlFor="desiredWorkHours"
                  className="block mb-2 font-medium"
                  style={{ color: "var(--pw-text-primary)" }}
                >
                  希望作業時間（1日あたり）
                </Label>
                <select
                  id="desiredWorkHours"
                  value={formData.desiredWorkHours}
                  onChange={(e) => setFormData({ ...formData, desiredWorkHours: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  style={{ borderColor: "var(--pw-border-gray)", fontSize: "var(--pw-text-base)" }}
                >
                  <option value="">選択してください</option>
                  {DROPDOWN_OPTIONS.DESIRED_WORK_HOURS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* 希望勤務スタイル */}
              <div>
                <Label className="block mb-2 font-medium" style={{ color: "var(--pw-text-primary)" }}>
                  希望勤務スタイル（複数選択可）
                </Label>
                <div className="flex flex-wrap gap-3">
                  {workStyleOptions.map((style) => (
                    <label
                      key={style}
                      className="flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-colors"
                      style={{
                        backgroundColor: formData.desiredWorkStyle.includes(style)
                          ? "var(--pw-button-primary)"
                          : "var(--pw-bg-light)",
                        color: formData.desiredWorkStyle.includes(style)
                          ? "white"
                          : "var(--pw-text-primary)",
                      }}
                    >
                      <Checkbox
                        checked={formData.desiredWorkStyle.includes(style)}
                        onCheckedChange={() => toggleWorkStyle(style)}
                        className="hidden"
                      />
                      {style}
                    </label>
                  ))}
                </div>
              </div>

              {/* 希望単価 */}
              <div>
                <Label
                  htmlFor="desiredRate"
                  className="block mb-2 font-medium"
                  style={{ color: "var(--pw-text-primary)" }}
                >
                  希望単価（月額）
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="desiredRate"
                    type="number"
                    placeholder="60"
                    value={formData.desiredRate}
                    onChange={(e) => setFormData({ ...formData, desiredRate: e.target.value })}
                    className="flex-1"
                  />
                  <span style={{ color: "var(--pw-text-gray)" }}>万円〜</span>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-4 mb-8"
              style={{ backgroundColor: "var(--pw-bg-light-blue)" }}
            >
              <p className="text-sm" style={{ color: "var(--pw-button-primary)" }}>
                💡 希望条件を設定すると、条件に合った案件が<strong>自動でマッチング</strong>されます
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                戻る
              </Button>
              <Button
                variant="pw-primary"
                size="lg"
                onClick={handleNext}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "保存中..." : "完了"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <button
              onClick={handleSkip}
              className="w-full mt-4 text-center text-sm underline"
              style={{ color: "var(--pw-text-gray)" }}
            >
              スキップして完了
            </button>
          </div>
        )}

        {/* 完了ステップ */}
        {currentStep === "complete" && (
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
              style={{ backgroundColor: "#e8f5f0" }}
            >
              <CheckCircle className="w-12 h-12" style={{ color: "var(--pw-alert-success)" }} />
            </div>
            <h2
              className="font-bold mb-3"
              style={{ fontSize: "var(--pw-text-2xl)", color: "var(--pw-text-primary)" }}
            >
              プロフィール設定が完了しました！
            </h2>
            <p className="mb-8" style={{ fontSize: "var(--pw-text-base)", color: "var(--pw-text-gray)" }}>
              あなたにぴったりの案件を探す準備が整いました。<br />
              さっそく案件を探してみましょう！
            </p>

            <div
              className="rounded-xl p-6 mb-8"
              style={{ backgroundColor: "var(--pw-bg-light-blue)", border: "1px solid var(--pw-button-primary)" }}
            >
              <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--pw-button-primary)" }} />
              <p className="font-medium mb-2" style={{ color: "var(--pw-text-primary)" }}>
                プロフィールをさらに充実させると、マッチ率UP！
              </p>
              <p className="text-sm" style={{ color: "var(--pw-text-gray)" }}>
                マイページで職務経歴やポートフォリオを追加すると、<br />
                より精度の高い案件マッチングが可能になります。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="pw-primary"
                size="lg"
                onClick={handleFinish}
                className="flex-1"
                style={{ fontSize: "var(--pw-text-lg)" }}
              >
                案件を探す
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleGoToMyPage}
                className="flex-1"
              >
                マイページで詳細を入力
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
