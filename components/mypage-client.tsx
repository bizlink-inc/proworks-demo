"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { SidebarLayout } from "@/components/layouts"
import { ProfileForm } from "@/components/profile-form"
import { WorkHistoryForm } from "@/components/work-history-form"
import { PreferencesForm } from "@/components/preferences-form"
import { SettingsForm } from "@/components/settings-form"
import { useApplicationStatusMonitor } from "@/hooks/use-application-status-monitor"
import { useWithdrawalCheck } from "@/hooks/use-withdrawal-check"
import type { Talent } from "@/lib/kintone/types"

type MenuItem = "profile" | "work-history" | "preferences" | "settings"

interface MyPageClientProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
  // SSRで事前取得したタレントデータ（初期表示高速化用）
  initialTalent?: Talent | null
}

export function MyPageClient({ user: sessionUser, initialTalent = null }: MyPageClientProps) {
  useApplicationStatusMonitor()
  const { handleWithdrawalError } = useWithdrawalCheck()

  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") as MenuItem | null

  const [activeMenu, setActiveMenu] = useState<MenuItem>(tabParam || "profile")
  // SSRでデータ取得済みの場合は即座に表示
  const [user, setUser] = useState<Talent | null>(initialTalent)

  useEffect(() => {
    // SSRでデータ取得済みの場合はAPIを呼ばない
    // SSRの段階でセッションが有効かつタレントデータが取得できていれば
    // ユーザーは退会していないことが保証されている
    if (!initialTalent) {
      fetchUser()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // クエリパラメータが変更されたら activeMenu を更新
  useEffect(() => {
    if (tabParam) {
      setActiveMenu(tabParam)
    }
  }, [tabParam])

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/me")

      if (!res.ok) {
        // 退会済みユーザーのチェック
        const isWithdrawn = await handleWithdrawalError(res)
        if (isWithdrawn) {
          return // 退会済みの場合はログアウト処理が走るため何もしない
        }

        if (res.status === 404) {
          // 404の場合は新規ユーザーとして空のデータを設定
          const emptyUser: Talent = {
            id: "",
            authUserId: sessionUser.id || "",
            lastName: "",
            firstName: "",
            fullName: "",
            lastNameKana: "",
            firstNameKana: "",
            email: sessionUser.email || "",
            birthDate: "",
            postalCode: "",
            address: "",
            phone: "",
            skills: "",
            experience: "",
            resumeFiles: [],
            portfolioUrl: "",
            availableFrom: "",
            desiredRate: "",
            desiredWorkDays: "",
            desiredCommute: "",
            desiredWorkStyle: [],
            desiredWorkHours: "",
            desiredWork: "",
            ngCompanies: "",
            otherRequests: "",
          }
          setUser(emptyUser)
          return
        }
        console.error("Failed to fetch user:", res.status, res.statusText)
        return
      }

      const data = await res.json()
      setUser(data)
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const menuItems: { id: MenuItem; label: string }[] = [
    { id: "profile", label: "プロフィール" },
    { id: "work-history", label: "職歴・資格" },
    { id: "preferences", label: "希望条件" },
    { id: "settings", label: "登録情報" },
  ]

  return (
    <div className="min-h-screen">
      <Header user={sessionUser} />

      <SidebarLayout
        activeMenu={activeMenu}
        onMenuChange={(menuId) => setActiveMenu(menuId as MenuItem)}
      >
        {/* コンテンツ全体の外枠は付けず、フォーム側のカードだけを表示する */}
        <div className="p-4 md:p-6">
          {activeMenu === "profile" && (
            <div>
              <h2
                className="font-bold mb-6"
                style={{
                  fontSize: "var(--pw-text-xl)",
                  color: "var(--pw-text-navy)"
                }}
              >
                プロフィール
              </h2>
              {user ? (
                <ProfileForm user={user} onUpdate={setUser} />
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: "var(--pw-text-gray)" }}>データを読み込んでいます...</p>
                </div>
              )}
            </div>
          )}

          {activeMenu === "work-history" && (
            <div>
              <h2
                className="font-bold mb-6"
                style={{
                  fontSize: "var(--pw-text-xl)",
                  color: "var(--pw-text-navy)"
                }}
              >
                職歴・資格
              </h2>
              {user ? (
                <WorkHistoryForm user={user} onUpdate={setUser} />
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: "var(--pw-text-gray)" }}>データを読み込んでいます...</p>
                </div>
              )}
            </div>
          )}

          {activeMenu === "preferences" && (
            <div>
              <h2
                className="font-bold mb-6"
                style={{
                  fontSize: "var(--pw-text-xl)",
                  color: "var(--pw-text-navy)"
                }}
              >
                希望条件
              </h2>
              {user ? (
                <PreferencesForm user={user} onUpdate={setUser} />
              ) : (
                <div className="text-center py-8">
                  <p style={{ color: "var(--pw-text-gray)" }}>データを読み込んでいます...</p>
                </div>
              )}
            </div>
          )}

          {activeMenu === "settings" && (
            <div>
              <h2
                className="font-bold mb-6"
                style={{
                  fontSize: "var(--pw-text-xl)",
                  color: "var(--pw-text-navy)"
                }}
              >
                登録情報
              </h2>
              <SettingsForm user={user} />
            </div>
          )}
        </div>
      </SidebarLayout>
    </div>
  )
}
