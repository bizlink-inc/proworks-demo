/**
 * モバイル用ハンバーガーメニュー
 * UI仕様書: レイアウト(テンプレート3種) - モバイル対応
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MobileMenuProps {
  user?: {
    name?: string | null
  } | null
  onSignOut?: () => void
}

export const MobileMenu = ({ user, onSignOut }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2"
        aria-label="メニューを開く"
      >
        {isOpen ? (
          <X className="w-6 h-6" style={{ color: "var(--pw-text-primary)" }} />
        ) : (
          <Menu className="w-6 h-6" style={{ color: "var(--pw-text-primary)" }} />
        )}
      </button>

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
          "fixed right-0 w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          top: "60px",
          height: "calc(100vh - 60px)",
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

              {/* ナビゲーションリンク */}
              <Link
                href="/"
                onClick={closeMenu}
                className={cn(
                  "px-4 py-3 rounded-md transition-colors",
                  pathname === "/"
                    ? "bg-[var(--pw-bg-light-blue)] text-[var(--pw-border-dark)] font-medium"
                    : "text-[var(--pw-text-gray)] hover:bg-[var(--pw-bg-light-blue)]"
                )}
                style={{ fontSize: "var(--pw-text-md)" }}
              >
                案件ダッシュボード
              </Link>

              <Link
                href="/me"
                onClick={closeMenu}
                className={cn(
                  "px-4 py-3 rounded-md transition-colors",
                  pathname === "/me"
                    ? "bg-[var(--pw-bg-light-blue)] text-[var(--pw-border-dark)] font-medium"
                    : "text-[var(--pw-text-gray)] hover:bg-[var(--pw-bg-light-blue)]"
                )}
                style={{ fontSize: "var(--pw-text-md)" }}
              >
                マイページ
              </Link>

              <Link
                href="/media/career"
                onClick={closeMenu}
                className={cn(
                  "px-4 py-3 rounded-md transition-colors",
                  pathname.startsWith("/media")
                    ? "bg-[var(--pw-bg-light-blue)] text-[var(--pw-border-dark)] font-medium"
                    : "text-[var(--pw-text-gray)] hover:bg-[var(--pw-bg-light-blue)]"
                )}
                style={{ fontSize: "var(--pw-text-md)" }}
              >
                メディア
              </Link>

              <Link
                href="/company"
                onClick={closeMenu}
                className={cn(
                  "px-4 py-3 rounded-md transition-colors",
                  pathname.startsWith("/company")
                    ? "bg-[var(--pw-bg-light-blue)] text-[var(--pw-border-dark)] font-medium"
                    : "text-[var(--pw-text-gray)] hover:bg-[var(--pw-bg-light-blue)]"
                )}
                style={{ fontSize: "var(--pw-text-md)" }}
              >
                企業情報
              </Link>

              <div
                className="my-4"
                style={{ borderTop: "1px solid var(--pw-border-lighter)" }}
              />

              <Button
                variant="pw-outline"
                className="w-full"
                onClick={() => {
                  onSignOut?.()
                  closeMenu()
                }}
              >
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/media/career"
                onClick={closeMenu}
                className="px-4 py-3 text-[var(--pw-text-gray)] hover:bg-[var(--pw-bg-light-blue)] rounded-md transition-colors"
                style={{ fontSize: "var(--pw-text-md)" }}
              >
                メディア
              </Link>

              <Link
                href="/company"
                onClick={closeMenu}
                className="px-4 py-3 text-[var(--pw-text-gray)] hover:bg-[var(--pw-bg-light-blue)] rounded-md transition-colors"
                style={{ fontSize: "var(--pw-text-md)" }}
              >
                企業情報
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

