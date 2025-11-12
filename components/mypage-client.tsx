"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { ProfileForm } from "@/components/profile-form"
import { ApplicationsTable } from "@/components/applications-table"
import { WorkHistoryForm } from "@/components/work-history-form"
import { PreferencesForm } from "@/components/preferences-form"
import { PasswordChangeForm } from "@/components/password-change-form"
import { EmailChangeForm } from "@/components/email-change-form"
import { Button } from "@/components/ui/button"
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
  const [activeMenu, setActiveMenu] = useState<MenuItem>("profile")
  const [user, setUser] = useState<Talent | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
    const res = await fetch("/api/me")
      if (!res.ok) {
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
    <div className="min-h-screen bg-gray-50">
      <Header user={sessionUser} />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">マイページ</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 左サイドメニュー */}
          <aside className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm border p-4 space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeMenu === item.id ? "default" : "ghost"}
                  className={`w-full justify-start ${activeMenu === item.id ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                  onClick={() => setActiveMenu(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </nav>
          </aside>

          {/* 右コンテンツ */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {activeMenu === "profile" && user && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">プロフィール</h2>
                  <ProfileForm user={user} onUpdate={setUser} />
                </div>
              )}

              {activeMenu === "work-history" && user && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">職歴・資格</h2>
                  <WorkHistoryForm user={user} onUpdate={setUser} />
                </div>
              )}

              {activeMenu === "preferences" && user && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">希望条件</h2>
                  <PreferencesForm user={user} onUpdate={setUser} />
                </div>
              )}

              {activeMenu === "applications" && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">応募済み案件</h2>
                  <ApplicationsTable />
                </div>
              )}

              {activeMenu === "password" && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">パスワード変更</h2>
                  <PasswordChangeForm />
                </div>
              )}

              {activeMenu === "email" && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">メールアドレス変更</h2>
                  <EmailChangeForm />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
