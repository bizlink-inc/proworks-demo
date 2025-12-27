/**
 * サブメニューなしレイアウト
 * 案件一覧・応募済み案件などで使用
 * UI仕様書: レイアウト(テンプレート3種) ③サブメニューなし
 */

import type React from "react"

interface FullWidthLayoutProps {
  children: React.ReactNode
  maxWidth?: string
}

export const FullWidthLayout = ({
  children,
  maxWidth = "1400px"
}: FullWidthLayoutProps) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--pw-bg-body)" }}>
      <main
        className="mx-auto px-6 py-8"
        style={{ maxWidth, backgroundColor: "var(--pw-bg-body)" }}
      >
        {children}
      </main>
    </div>
  )
}

