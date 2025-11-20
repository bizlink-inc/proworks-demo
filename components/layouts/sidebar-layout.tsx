/**
 * 左サイドサブメニューありレイアウト
 * マイページなどで使用
 * UI仕様書: レイアウト(テンプレート3種) ②左サイドサブメニューあり
 */

import type React from "react"
import { cn } from "@/lib/utils"

interface SidebarLayoutProps {
  children: React.ReactNode
  activeMenu?: string
  menuItems?: MenuItem[]
  onMenuChange?: (menuId: string) => void
}

interface MenuItem {
  id: string
  label: string
  icon?: string
}

const defaultMenuItems: MenuItem[] = [
  { id: "profile", label: "プロフィール" },
  { id: "work-history", label: "職歴・資格" },
  { id: "preferences", label: "希望条件" },
  { id: "applications", label: "応募済み案件" },
  { id: "password", label: "パスワード変更" },
  { id: "email", label: "メールアドレス変更" },
]

export const SidebarLayout = ({
  children,
  activeMenu,
  menuItems = defaultMenuItems,
  onMenuChange
}: SidebarLayoutProps) => {
  return (
    <div className="min-h-screen bg-[var(--pw-bg-body)]">
      <div className="flex flex-col md:flex-row max-w-[1400px] mx-auto">
        {/* サイドメニュー - デスクトップ */}
        <aside
          className="hidden md:block w-64 min-h-screen border-r"
          style={{ 
            backgroundColor: "var(--pw-bg-light-blue)",
            borderColor: "var(--pw-border-lighter)"
          }}
          aria-label="サイドバーナビゲーション"
        >
          <div className="px-6 py-4 border-b" style={{ borderColor: "var(--pw-border-lighter)" }}>
            <p 
              className="text-sm font-semibold"
              style={{ color: "var(--pw-text-navy)" }}
            >
              メニュー
            </p>
          </div>
          <nav className="py-4" role="navigation">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onMenuChange?.(item.id)}
                className={cn(
                  "w-full text-left block px-6 py-3 transition-colors",
                  activeMenu === item.id
                    ? "bg-white font-medium"
                    : "text-[var(--pw-text-primary)] hover:bg-white/60"
                )}
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: activeMenu === item.id ? "var(--pw-text-navy)" : "var(--pw-text-navy)",
                  borderRadius: activeMenu === item.id ? "0 4px 4px 0" : "0"
                }}
                aria-current={activeMenu === item.id ? "page" : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* サイドメニュー - モバイル（タブ形式） */}
        <div className="md:hidden bg-white border-b border-[var(--pw-border-lighter)] overflow-x-auto">
          <nav className="flex" role="navigation" aria-label="モバイルナビゲーション">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onMenuChange?.(item.id)}
                className={cn(
                  "px-4 py-3 whitespace-nowrap transition-colors flex-shrink-0",
                  activeMenu === item.id
                    ? "text-[var(--pw-button-primary)] border-b-2 border-[var(--pw-button-primary)] font-medium"
                    : "text-[var(--pw-text-gray)]"
                )}
                style={{ fontSize: "var(--pw-text-sm)" }}
                aria-current={activeMenu === item.id ? "page" : undefined}
                role="tab"
                aria-selected={activeMenu === item.id}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* メインコンテンツ */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

