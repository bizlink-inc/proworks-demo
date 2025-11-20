/**
 * センター寄せ台紙レイアウト
 * ログイン・新規登録画面などで使用
 * UI仕様書: レイアウト(テンプレート3種) ①センター寄せ台紙
 */

import type React from "react"

interface CenteredLayoutProps {
  children: React.ReactNode
  showFooter?: boolean
  showHeader?: boolean
}

export const CenteredLayout = ({ children, showFooter = true, showHeader = true }: CenteredLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--pw-bg-body)]">
      {showHeader && (
        <header
          className="bg-white py-3 px-6"
          style={{ borderBottom: "1px solid var(--pw-border-lighter)" }}
        >
          <div className="container mx-auto">
            <span
              className="font-bold"
              style={{
                fontSize: "var(--pw-text-md)",
                color: "var(--pw-text-navy)"
              }}
            >
              PRO WORKS
            </span>
          </div>
        </header>
      )}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div
          className="w-full bg-white rounded-[var(--pw-radius-md)] shadow-[0_0_0_1px_var(--pw-border-lighter)] p-8 sm:p-10"
          style={{
            maxWidth: '520px',
            boxShadow: '0 2px 8px var(--pw-shadow)',
          }}
        >
          {children}
        </div>
      </main>
      {showFooter && (
        <footer
          className="py-4 text-center"
          style={{ borderTop: "1px solid var(--pw-border-separator)" }}
        >
          <div className="flex justify-center gap-4 text-[var(--pw-text-sm)] text-[var(--pw-text-gray)]">
            <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
              利用規約
            </a>
            <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
              プライバシーポリシー
            </a>
            <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
              ヘルプ
            </a>
            <a href="#" className="hover:text-[var(--pw-button-primary)] transition-colors">
              お問い合わせ
            </a>
          </div>
        </footer>
      )}
    </div>
  )
}

