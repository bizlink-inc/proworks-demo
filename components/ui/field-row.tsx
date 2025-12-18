/**
 * フィールド行コンポーネント
 * 見出しを左側、入力フィールドを右側に配置する2カラムレイアウト
 */

import * as React from "react"
import { SupportTag } from "@/components/ui/support-tag"
import { cn } from "@/lib/utils"

interface FieldRowProps {
  label: string
  required?: boolean
  isEmpty?: boolean
  children: React.ReactNode
  className?: string
}

export const FieldRow = ({
  label,
  required = false,
  isEmpty = false,
  children,
  className,
}: FieldRowProps) => {
  const hasNoBorderTop = className?.includes("border-t-0");
  
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-4 md:gap-6 py-6",
        className
      )}
      style={{
        borderTop: hasNoBorderTop ? "none" : "1px solid var(--pw-border-lighter)",
      }}
    >
      {/* 左側: 見出しブロック */}
      <div className="flex-shrink-0 md:w-64 lg:w-72">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            {required && <SupportTag>必須</SupportTag>}
            <p
              className="font-semibold whitespace-nowrap"
              style={{
                fontSize: "var(--pw-text-md)",
                color: "var(--pw-text-primary)",
              }}
            >
              {label}
            </p>
          </div>
          {required && isEmpty && (
            <p
              style={{
                fontSize: "var(--pw-text-xs)",
                color: "var(--pw-alert-error)",
              }}
            >
              ※未入力です
            </p>
          )}
        </div>
      </div>

      {/* 右側: 入力フィールド */}
      <div className="flex-1 min-w-0 max-w-2xl">
        {children}
      </div>
    </div>
  )
}

