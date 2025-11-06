"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { handleSignOut } from "@/app/actions/auth"

type HeaderProps = {
  user?: {
    name?: string | null
  } | null
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()

  const onSignOut = async () => {
    await handleSignOut()
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href={user ? "/" : "/landing"} className="text-2xl font-bold text-blue-600">
          PRO WORKS
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <>
              <nav className="flex gap-1">
                <Link
                  href="/"
                  className={`px-4 py-2 rounded-md transition-colors ${
                    pathname === "/"
                      ? "bg-blue-100 text-blue-700 font-semibold border-b-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  案件ダッシュボード
                </Link>
                <Link
                  href="/me"
                  className={`px-4 py-2 rounded-md transition-colors ${
                    pathname === "/me"
                      ? "bg-blue-100 text-blue-700 font-semibold border-b-2 border-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  マイページ
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`px-4 py-2 rounded-md transition-colors flex items-center gap-1 ${
                        pathname.startsWith("/media")
                          ? "bg-blue-100 text-blue-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      メディア
                      <ChevronDown className="w-4 h-4" />
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
                <Link
                  href="/company"
                  className={`px-4 py-2 rounded-md transition-colors ${
                    pathname.startsWith("/company")
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  企業情報
                </Link>
              </nav>

              <button className="text-gray-600 hover:text-gray-900">
                <Bell className="w-5 h-5" />
              </button>

              <span className="text-sm font-medium text-gray-700">{user.name}</span>

              <Button variant="outline" size="sm" onClick={onSignOut}>
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/media/career" className="text-gray-600 hover:text-blue-600">
                  メディア
                </Link>
                <Link href="/company" className="text-gray-600 hover:text-blue-600">
                  企業情報
                </Link>
              </nav>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  ログイン
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  新規登録
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
