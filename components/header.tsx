"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faGear, faAddressCard, faBuilding, faList, faComments } from "@fortawesome/free-solid-svg-icons"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MobileMenu } from "@/components/mobile-menu"
import { handleSignOut } from "@/app/actions/auth"
import { NotificationDropdown } from "@/components/notification-dropdown"

type HeaderProps = {
  user?: {
    name?: string | null
  } | null
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const onSignOut = async () => {
    await handleSignOut()
  }

  // Hydration errorを避けるため、クライアントサイドでマウントされるまで待つ
  if (!isMounted) {
    return (
      <header
        className="bg-white"
        style={{ borderBottom: "1px solid var(--pw-border-lighter)" }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={user ? "/" : "/landing"}
            className="font-bold"
            style={{ 
              color: "var(--pw-border-dark)",
              fontSize: "var(--pw-text-xl)"
            }}
          >
            PRO WORKS
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
        borderBottom: "1px solid var(--pw-border-lighter)",
        fontSize: "var(--pw-text-md)"
      }}
    >
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <Link
          href={user ? "/" : "/landing"}
          className="font-bold"
          style={{
            color: "var(--pw-text-navy)",
            fontSize: "var(--pw-text-xl)"
          }}
        >
          PRO WORKS
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <nav className="hidden md:flex gap-0">
                <Link
                  href="/me"
                  className="px-4 py-3 transition-colors flex items-center gap-2"
                  style={{
                    fontSize: "var(--pw-text-md)",
                    color: pathname === "/me" ? "#3966a2" : "var(--pw-text-navy)",
                    borderBottom: pathname === "/me" ? "4.5px solid #3966a2" : "none",
                    fontWeight: pathname === "/me" ? 600 : 400,
                  }}
                >
                  <FontAwesomeIcon icon={faGear} className="w-5 h-5" />
                  マイページ
                </Link>
                <Link
                  href="/"
                  className="px-4 py-3 transition-colors flex items-center gap-2"
                  style={{
                    fontSize: "var(--pw-text-md)",
                    color: pathname === "/" ? "#3966a2" : "var(--pw-text-navy)",
                    borderBottom: pathname === "/" ? "4.5px solid #3966a2" : "none",
                    fontWeight: pathname === "/" ? 600 : 400,
                  }}
                >
                  <FontAwesomeIcon icon={faList} className="w-5 h-5" />
                  案件一覧
                </Link>
                <Link
                  href="/me?tab=applications"
                  className="px-4 py-3 transition-colors flex items-center gap-2"
                  style={{
                    fontSize: "var(--pw-text-md)",
                    color: "var(--pw-text-navy)",
                    borderBottom: "none",
                    fontWeight: 400,
                  }}
                >
                  <FontAwesomeIcon icon={faAddressCard} className="w-5 h-5" />
                  応募済み案件
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="px-4 py-3 transition-colors flex items-center gap-2"
                      style={{
                        fontSize: "var(--pw-text-md)",
                        color: pathname.startsWith("/media") ? "#3966a2" : "var(--pw-text-navy)",
                        borderBottom: pathname.startsWith("/media") ? "4.5px solid #3966a2" : "none",
                        fontWeight: pathname.startsWith("/media") ? 600 : 400,
                      }}
                    >
                      <FontAwesomeIcon icon={faComments} className="w-5 h-5" />
                      お役立ち情報
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/media/career" className="cursor-pointer">
                        キャリアとスキル
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/media/business" className="cursor-pointer">
                        ビジネス知識
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/media/voice" className="cursor-pointer">
                        みんなの声
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>

              <div className="hidden md:flex items-center gap-4">
              <NotificationDropdown />

                <span
                  className="font-medium"
                  style={{
                    fontSize: "var(--pw-text-sm)",
                    color: "var(--pw-text-primary)"
                  }}
                >
                  {user.name}
                </span>

              <Button variant="outline" size="sm" onClick={onSignOut}>
                ログアウト
              </Button>
              </div>

              <MobileMenu user={user} onSignOut={onSignOut} />
            </>
          ) : (
            <>
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
                    <FontAwesomeIcon icon={faComments} className="w-5 h-5" />
                    お役立ち情報
                </Link>
                  <Link
                    href="/company"
                    className="hover:text-[var(--pw-button-primary)] transition-colors flex items-center gap-2"
                    style={{
                      color: "var(--pw-text-navy)",
                      fontSize: "var(--pw-text-md)"
                    }}
                  >
                    <FontAwesomeIcon icon={faBuilding} className="w-5 h-5" />
                  企業情報
                </Link>
              </nav>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  ログイン
                </Button>
              </Link>
              <Link href="/auth/signup">
                  <Button
                    size="sm"
                    style={{
                      backgroundColor: "var(--pw-button-primary)",
                      color: "white"
                    }}
                    className="hover:opacity-90"
                  >
                  新規登録
                </Button>
              </Link>
              </div>

              <MobileMenu />
            </>
          )}
        </div>
      </div>
    </header>
  )
}
