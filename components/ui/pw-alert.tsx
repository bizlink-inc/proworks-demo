/**
 * PRO WORKS アラートコンポーネント
 * UI仕様書: アラート
 * 
 * 仕様:
 * - 台紙背景: #fecfd7 (error-light) / #ffe3e8 (error-lighter)
 * - タイトル台紙: #d22852
 * - フォント - タイトル: 15pt #ffffff
 * - フォント - 本文: 13pt #000000
 * - 緊急度「高」: #d22852
 * - リンク: #d22852
 */

import * as React from "react"
import { cn } from "@/lib/utils"

interface PWAlertProps extends React.ComponentProps<"div"> {
  variant?: "error" | "error-light" | "warning" | "success" | "info"
  title?: string
}

const PWAlert = React.forwardRef<HTMLDivElement, PWAlertProps>(
  ({ className, variant = "info", title, children, ...props }, ref) => {
    // UI仕様書に基づくスタイル定義
    const variantStyles = {
      // エラー（緊急度「高」）- ライター背景
      error: {
        bg: "#ffe3e8", // 台紙背景（ライター）
        titleBg: "#d22852", // タイトル台紙
        linkColor: "#d22852", // リンク色
      },
      // エラー（軽度）- ライト背景
      "error-light": {
        bg: "#fecfd7", // 台紙背景（ライト）
        titleBg: "#d22852", // タイトル台紙
        linkColor: "#d22852", // リンク色
      },
      warning: {
        bg: "#fff4e6",
        titleBg: "#fa8212",
        linkColor: "#fa8212",
      },
      success: {
        bg: "#e6f7f0",
        titleBg: "#3f9c78",
        linkColor: "#3f9c78",
      },
      info: {
        bg: "#e8f0fd",
        titleBg: "#63b2cd",
        linkColor: "#63b2cd",
      },
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--pw-radius-sm)] overflow-hidden",
          className
        )}
        style={{ backgroundColor: variantStyles[variant].bg }}
        {...props}
      >
        {title && (
          <div
            className="px-4 py-2 font-medium"
            style={{
              backgroundColor: variantStyles[variant].titleBg,
              fontSize: "15px", // 仕様書: 15pt
              color: "#ffffff"
            }}
          >
            {title}
          </div>
        )}
        <div
          className="px-4 py-3"
          style={{
            fontSize: "13px", // 仕様書: 13pt
            color: "#000000"
          }}
        >
          {children}
        </div>
      </div>
    )
  }
)
PWAlert.displayName = "PWAlert"

export { PWAlert }

