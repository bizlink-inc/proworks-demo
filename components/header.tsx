"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { HelpCircle } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGear, faList, faLightbulb } from "@fortawesome/free-solid-svg-icons"
import { faSquareCheck } from "@fortawesome/free-regular-svg-icons"
import { MobileMenu } from "@/components/mobile-menu"
import { handleSignOut } from "@/app/actions/auth"
import { NotificationDropdown } from "@/components/notification-dropdown"

type HeaderProps = {
  user?: {
    name?: string | null
  } | null
}

export function Header({ user }: HeaderProps) {
  const searchParams = useSearchParams()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const onSignOut = async () => {
    // ログアウト時にlocalStorageの通知関連データをクリア
    localStorage.removeItem("notifications")
    localStorage.removeItem("previous_application_status")
    localStorage.removeItem("seed_notification_initialized")
    localStorage.removeItem("read_recommended_notifications")
    localStorage.removeItem("profile_notification_dismissed_at")
    localStorage.removeItem("pw_current_user_id")
    await handleSignOut()
  }

  // 現在のタブを取得（デフォルトはjobs）
  const currentTab = searchParams.get("tab") || "jobs"

  // Hydration errorを避けるため、クライアントサイドでマウントされるまで待つ
  if (!isMounted) {
    return (
      <header
        className="bg-white"
      >
        <div
          className="mx-auto px-6 py-4 flex items-center justify-between"
          style={{ maxWidth: "1400px" }}
        >
          <Link
            href={user ? "/" : "/auth/signin"}
            className="font-bold flex-shrink-0"
          >
            <Image
              src="/logo_proworks.svg"
              alt="PRO WORKS"
              width={150}
              height={24}
              priority
            />
          </Link>
          <div className="w-8 h-8" /> {/* プレースホルダー */}
        </div>
      </header>
    )
  }

  return (
    <header
      className="bg-white"
      style={{
        fontSize: "var(--pw-text-md)"
      }}
    >
      <div
        className="mx-auto px-6 pt-3 flex items-center justify-between"
        style={{ maxWidth: "1400px" }}
      >
        {/* 左側: ロゴ */}
        <Link
          href={user ? "/" : "/auth/signin"}
          className="font-bold flex-shrink-0"
        >
          <Image
            src="/logo_proworks.svg"
            alt="PRO WORKS"
            width={150}
            height={24}
            priority
          />
        </Link>

        {user ? (
          <>
            {/* デスクトップナビゲーション - 大画面: テキスト付き（左寄せ） */}
            <nav className="hidden lg:flex gap-0 ml-6">
              <Link
                href="/?tab=profile"
                className="px-4 py-3 transition-colors flex items-center gap-2"
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: currentTab === "profile" ? "var(--pw-header-active-text)" : "var(--pw-text-navy)",
                  borderBottom: currentTab === "profile" ? `var(--pw-header-active-border-width) solid var(--pw-header-active-border-color)` : "none",
                  fontWeight: currentTab === "profile" ? 600 : 400,
                }}
              >
                <FontAwesomeIcon icon={faGear} className="w-5 h-5" />
                <span>マイページ</span>
              </Link>
              <Link
                href="/"
                className="px-4 py-3 transition-colors flex items-center gap-2"
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: currentTab === "jobs" ? "var(--pw-header-active-text)" : "var(--pw-text-navy)",
                  borderBottom: currentTab === "jobs" ? `var(--pw-header-active-border-width) solid var(--pw-header-active-border-color)` : "none",
                  fontWeight: currentTab === "jobs" ? 600 : 400,
                }}
              >
                <FontAwesomeIcon icon={faList} className="w-5 h-5" />
                <span>案件一覧</span>
              </Link>
              <Link
                href="/?tab=applications"
                className="px-4 py-3 transition-colors flex items-center gap-2"
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: currentTab === "applications" ? "var(--pw-header-active-text)" : "var(--pw-text-navy)",
                  borderBottom: currentTab === "applications" ? `var(--pw-header-active-border-width) solid var(--pw-header-active-border-color)` : "none",
                  fontWeight: currentTab === "applications" ? 600 : 400,
                }}
              >
                <FontAwesomeIcon icon={faSquareCheck} className="w-5 h-5" />
                <span>応募済み案件</span>
              </Link>
            </nav>

            {/* タブレットナビゲーション - 中画面: アイコンのみ */}
            <nav className="hidden md:flex lg:hidden gap-0 ml-6">
              <Link
                href="/?tab=profile"
                className="px-3 py-3 transition-colors flex items-center justify-center"
                style={{
                  color: currentTab === "profile" ? "var(--pw-header-active-text)" : "var(--pw-text-navy)",
                  borderBottom: currentTab === "profile" ? `var(--pw-header-active-border-width) solid var(--pw-header-active-border-color)` : "none",
                }}
                title="マイページ"
              >
                <FontAwesomeIcon icon={faGear} className="w-5 h-5" />
              </Link>
              <Link
                href="/"
                className="px-3 py-3 transition-colors flex items-center justify-center"
                style={{
                  color: currentTab === "jobs" ? "var(--pw-header-active-text)" : "var(--pw-text-navy)",
                  borderBottom: currentTab === "jobs" ? `var(--pw-header-active-border-width) solid var(--pw-header-active-border-color)` : "none",
                }}
                title="案件一覧"
              >
                <FontAwesomeIcon icon={faList} className="w-5 h-5" />
              </Link>
              <Link
                href="/?tab=applications"
                className="px-3 py-3 transition-colors flex items-center justify-center"
                style={{
                  color: currentTab === "applications" ? "var(--pw-header-active-text)" : "var(--pw-text-navy)",
                  borderBottom: currentTab === "applications" ? `var(--pw-header-active-border-width) solid var(--pw-header-active-border-color)` : "none",
                }}
                title="応募済み案件"
              >
                <FontAwesomeIcon icon={faSquareCheck} className="w-5 h-5" />
              </Link>
            </nav>

            {/* デスクトップ右側アイコン - 大画面 */}
            <div className="hidden lg:flex items-center gap-4 ml-auto">
              <button
                className="p-2 transition-colors hover:opacity-70"
                style={{ color: "var(--pw-text-navy)" }}
                title="ヘルプ"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              <NotificationDropdown />

              <span
                className="font-medium"
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: "var(--pw-text-primary)"
                }}
              >
                {user.name}
              </span>

              <button
                onClick={onSignOut}
                className="p-2 transition-colors hover:opacity-70"
                title="ログアウト"
              >
                <Image
                  src="/logout.svg"
                  alt="ログアウト"
                  width={20}
                  height={20}
                />
              </button>
            </div>

            {/* タブレット右側アイコン - 中画面 */}
            <div className="hidden md:flex lg:hidden items-center gap-3 ml-auto">
              <button
                className="p-2 transition-colors hover:opacity-70"
                style={{ color: "var(--pw-text-navy)" }}
                title="ヘルプ"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              <NotificationDropdown />

              <span
                className="font-medium"
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: "var(--pw-text-primary)"
                }}
              >
                {user.name}
              </span>

              <button
                onClick={onSignOut}
                className="p-2 transition-colors hover:opacity-70"
                title="ログアウト"
              >
                <Image
                  src="/logout.svg"
                  alt="ログアウト"
                  width={20}
                  height={20}
                />
              </button>
            </div>

            <MobileMenu user={user} onSignOut={onSignOut} />
          </>
        ) : (
          <>
            {/* 未ログイン時のスペーサー */}
            <div className="flex-1" />

            <div className="hidden md:flex items-center gap-4">
              <nav className="flex items-center gap-4">
                <Link
                  href="/media/career"
                  className="hover:text-[var(--pw-button-primary)] transition-colors flex items-center gap-2"
                  style={{
                    color: "var(--pw-text-navy)",
                    fontSize: "var(--pw-text-md)"
                  }}
                >
                  <FontAwesomeIcon icon={faLightbulb} className="w-5 h-5" />
                  お役立ち情報
                </Link>
              </nav>
              <Link href="/auth/signin">
                <button
                  className="px-4 py-2 border rounded transition-colors hover:opacity-70"
                  style={{
                    borderColor: "var(--pw-border-light)",
                    color: "var(--pw-text-navy)",
                    fontSize: "var(--pw-text-sm)"
                  }}
                >
                  ログイン
                </button>
              </Link>
              <Link href="/auth/signup">
                <button
                  className="px-4 py-2 rounded transition-colors hover:opacity-90"
                  style={{
                    backgroundColor: "var(--pw-button-primary)",
                    color: "white",
                    fontSize: "var(--pw-text-sm)"
                  }}
                >
                  新規登録
                </button>
              </Link>
            </div>

            <MobileMenu />
          </>
        )}
      </div>
    </header>
  )
}
