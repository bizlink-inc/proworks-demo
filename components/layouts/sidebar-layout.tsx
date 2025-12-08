/**
 * 左サイドサブメニューありレイアウト
 * マイページなどで使用
 * UI仕様書: レイアウト(テンプレート3種) ②左サイドサブメニューあり
 */

import type React from "react"
import { cn } from "@/lib/utils"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAddressCard, faFileLines, faCircleCheck, faEnvelope } from '@fortawesome/free-regular-svg-icons'

interface SidebarLayoutProps {
  children: React.ReactNode
  activeMenu?: string
  menuItems?: MenuItem[]
  onMenuChange?: (menuId: string) => void
}

interface MenuItem {
  id: string
  label: string
  icon?: any
}

const defaultMenuItems: MenuItem[] = [
  { id: "profile", label: "プロフィール", icon: faAddressCard },
  { id: "work-history", label: "職歴・資格", icon: faFileLines },
  { id: "preferences", label: "希望条件", icon: faCircleCheck },
  { id: "settings", label: "登録情報", icon: faEnvelope },
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
          className="hidden md:block w-64 min-h-screen pt-6"
          style={{ 
            backgroundColor: "var(--pw-bg-body)",
          }}
          aria-label="サイドバーナビゲーション"
        >
          <nav className="py-2 pr-4" role="navigation">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onMenuChange?.(item.id)}
                className={cn(
                  "w-full text-left flex items-center gap-3 px-4 py-3 mb-2 transition-all",
                  activeMenu === item.id
                    ? "font-medium"
                    : "hover:bg-white/50"
                )}
                style={{
                  fontSize: "var(--pw-text-md)",
                  color: activeMenu === item.id ? "var(--pw-sidemenu-active-text)" : "var(--pw-sidemenu-text)",
                  borderRadius: activeMenu === item.id ? "var(--pw-sidemenu-active-radius)" : "0px 4px 4px 0px",
                  backgroundColor: activeMenu === item.id ? "var(--pw-sidemenu-active-bg)" : "transparent",
                }}
                aria-current={activeMenu === item.id ? "page" : undefined}
              >
                {item.icon && (
                  <FontAwesomeIcon 
                    icon={item.icon} 
                    className="w-5 h-5 flex-shrink-0"
                  />
                )}
                <span>{item.label}</span>
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

