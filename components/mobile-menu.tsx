/**
 * モバイル用ハンバーガーメニュー
 * UI仕様書: レイアウト(テンプレート3種) - モバイル対応
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Menu, X, HelpCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/notification-dropdown"

interface MobileMenuProps {
  user?: {
    name?: string | null
  } | null
  onSignOut?: () => void
}

export const MobileMenu = ({ user, onSignOut }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // 現在のタブを取得
  const currentTab = searchParams.get("tab") || "jobs"

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  // タブナビゲーション（ページ遷移なし）
  const navigateToTab = (tab: string) => {
    if (tab === "jobs") {
      router.push("/", { scroll: false })
    } else {
      router.push(`/?tab=${tab}`, { scroll: false })
    }
    closeMenu()
  }

  return (
    <>
      {/* モバイルヘッダー右側のアイコン群 */}
      <div className="flex md:hidden items-center gap-2">
        {user && (
          <>
            <button
              className="p-2 transition-colors hover:opacity-70"
              style={{ color: "var(--pw-text-navy)" }}
              title="ヘルプ"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <NotificationDropdown />
          </>
        )}

        {/* ハンバーガーボタン */}
        <button
          onClick={toggleMenu}
          className="p-2"
          aria-label="メニューを開く"
        >
          {isOpen ? (
            <X className="w-6 h-6" style={{ color: "var(--pw-text-primary)" }} />
          ) : (
            <Menu className="w-6 h-6" style={{ color: "var(--pw-text-primary)" }} />
          )}
        </button>
      </div>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMenu}
          style={{ top: "60px" }}
        />
      )}

      {/* メニューパネル */}
      <div
        className={cn(
          "fixed right-0 w-64 shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          top: "60px",
          height: "calc(100vh - 60px)",
          backgroundColor: "var(--pw-bg-light-blue)",
          borderLeft: "1px solid var(--pw-border-lighter)",
        }}
      >
        <nav className="flex flex-col p-4">
          {user ? (
            <>
              {/* ユーザー情報 */}
              <div
                className="pb-4 mb-4"
                style={{ borderBottom: "1px solid var(--pw-border-lighter)" }}
              >
                <p
                  className="font-medium"
                  style={{
                    fontSize: "var(--pw-text-sm)",
                    color: "var(--pw-text-primary)"
                  }}
                >
                  {user.name}
                </p>
              </div>

              {/* ナビゲーションリンク（タブベース） */}
              <button
                onClick={() => navigateToTab("profile")}
                className={cn(
                  "px-4 py-3 rounded-md transition-colors text-left",
                  currentTab === "profile"
                    ? "bg-[var(--pw-bg-light-blue)] text-[var(--pw-border-dark)] font-medium"
                    : "text-[var(--pw-text-gray)] hover:bg-[var(--pw-bg-light-blue)]"
                )}
                style={{ fontSize: "var(--pw-text-md)" }}
              >
                マイページ
              </button>

              <button
                onClick={() => navigateToTab("jobs")}
                className={cn(
                  "px-4 py-3 rounded-md transition-colors text-left",
                  currentTab === "jobs"
                    ? "bg-[var(--pw-bg-light-blue)] text-[var(--pw-border-dark)] font-medium"
                    : "text-[var(--pw-text-gray)] hover:bg-[var(--pw-bg-light-blue)]"
                )}
                style={{ fontSize: "var(--pw-text-md)" }}
              >
                案件一覧
              </button>

              <button
                onClick={() => navigateToTab("applications")}
                className={cn(
                  "px-4 py-3 rounded-md transition-colors text-left",
                  currentTab === "applications"
                    ? "bg-[var(--pw-bg-light-blue)] text-[var(--pw-border-dark)] font-medium"
                    : "text-[var(--pw-text-gray)] hover:bg-[var(--pw-bg-light-blue)]"
                )}
                style={{ fontSize: "var(--pw-text-md)" }}
              >
                応募済み案件
              </button>

              <button
                disabled
                className="px-4 py-3 rounded-md text-left opacity-50 cursor-not-allowed"
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: "var(--pw-text-gray)"
                }}
              >
                お役立ち情報
              </button>

              <div
                className="my-4"
                style={{ borderTop: "1px solid var(--pw-border-lighter)" }}
              />

              <button
                className="px-4 py-3 rounded-md transition-colors flex items-center gap-2 text-left hover:bg-white/50"
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: "var(--pw-text-gray)"
                }}
                onClick={() => {
                  onSignOut?.()
                  closeMenu()
                }}
              >
                <LogOut className="w-5 h-5" />
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                href="/media/career"
                onClick={closeMenu}
                className="px-4 py-3 text-[var(--pw-text-gray)] hover:bg-[var(--pw-bg-light-blue)] rounded-md transition-colors"
                style={{ fontSize: "var(--pw-text-md)" }}
              >
                お役立ち情報
              </Link>

              <div
                className="my-4"
                style={{ borderTop: "1px solid var(--pw-border-lighter)" }}
              />

              <Link href="/auth/signin" onClick={closeMenu}>
                <Button variant="pw-outline" className="w-full mb-2">
                  ログイン
                </Button>
              </Link>

              <Link href="/auth/signup" onClick={closeMenu}>
                <Button variant="pw-primary" className="w-full">
                  新規登録
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  )
}
