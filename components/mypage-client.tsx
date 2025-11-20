"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { SidebarLayout } from "@/components/layouts"
import { ProfileForm } from "@/components/profile-form"
import { ApplicationsTable } from "@/components/applications-table"
import { WorkHistoryForm } from "@/components/work-history-form"
import { PreferencesForm } from "@/components/preferences-form"
import { PasswordChangeForm } from "@/components/password-change-form"
import { EmailChangeForm } from "@/components/email-change-form"
import { useApplicationStatusMonitor } from "@/hooks/use-application-status-monitor"
import type { Talent } from "@/lib/kintone/types"

type MenuItem = "profile" | "work-history" | "preferences" | "applications" | "password" | "email"

interface MyPageClientProps {
  user: {
    id?: string
    name?: string | null
    email?: string | null
  }
}

export function MyPageClient({ user: sessionUser }: MyPageClientProps) {
  useApplicationStatusMonitor()

  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") as MenuItem | null

  const [activeMenu, setActiveMenu] = useState<MenuItem>(tabParam || "profile")
  const [user, setUser] = useState<Talent | null>(null)

  useEffect(() => {
    fetchUser()
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
        if (res.status === 404) {
          // 404の場合は新規ユーザーとして空のデータを設定
          console.log("User not found in Kintone, treating as new user")
          const emptyUser: Talent = {
            id: "",
            auth_user_id: sessionUser.id || "",
            email: sessionUser.email || "",
            lastName: "",
            firstName: "",
            lastNameKana: "",
            firstNameKana: "",
            phone: "",
            birthDate: "",
            gender: "",
            postalCode: "",
            address: "",
            nearestStation: "",
            employmentStatus: "",
            desiredWorkLocation: [],
            desiredIndustry: [],
            desiredOccupation: [],
            skills: [],
            certifications: [],
            workHistory: [],
            selfPR: "",
            portfolioUrl: "",
            githubUrl: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          setUser(emptyUser)
          return
        }
        console.error("Failed to fetch user:", res.status, res.statusText)
        return
      }

      const data = await res.json()
      console.log("Fetched user data:", data)
      setUser(data)
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const menuItems: { id: MenuItem; label: string }[] = [
    { id: "profile", label: "プロフィール" },
    { id: "work-history", label: "職歴・資格" },
    { id: "preferences", label: "希望条件" },
    { id: "applications", label: "応募済み案件" },
    { id: "password", label: "パスワード変更" },
    { id: "email", label: "メールアドレス変更" },
  ]

  return (
    <div className="min-h-screen">
      <Header user={sessionUser} />

      <SidebarLayout
        activeMenu={activeMenu}
        onMenuChange={setActiveMenu}
      >
        <div className="bg-white rounded-[var(--pw-radius-sm)] border border-[var(--pw-border-lighter)] p-6">
          {activeMenu === "profile" && (
            <div>
              <h2
                className="font-semibold mb-6"
                style={{
                  fontSize: "var(--pw-text-xl)",
                  color: "var(--pw-text-primary)"
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
                className="font-semibold mb-6"
                style={{
                  fontSize: "var(--pw-text-xl)",
                  color: "var(--pw-text-primary)"
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
                className="font-semibold mb-6"
                style={{
                  fontSize: "var(--pw-text-xl)",
                  color: "var(--pw-text-primary)"
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

          {activeMenu === "applications" && (
            <div>
              <h2
                className="font-semibold mb-6"
                style={{
                  fontSize: "var(--pw-text-xl)",
                  color: "var(--pw-text-primary)"
                }}
              >
                応募済み案件
              </h2>
              <ApplicationsTable />
            </div>
          )}

          {activeMenu === "password" && (
            <div>
              <h2
                className="font-bold mb-6"
                style={{
                  fontSize: "var(--pw-text-2xl)",
                  color: "var(--pw-text-primary)"
                }}
              >
                パスワード変更
              </h2>
              <PasswordChangeForm />
            </div>
          )}

          {activeMenu === "email" && (
            <div>
              <h2
                className="font-bold mb-6"
                style={{
                  fontSize: "var(--pw-text-2xl)",
                  color: "var(--pw-text-primary)"
                }}
              >
                メールアドレス変更
              </h2>
              <EmailChangeForm />
            </div>
          )}
        </div>
      </SidebarLayout>
    </div>
  )
}
