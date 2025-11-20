/**
 * PRO WORKS アラートコンポーネント
 * UI仕様書: 各要素 > アラート
 */

import * as React from "react"
import { cn } from "@/lib/utils"

interface PWAlertProps extends React.ComponentProps<"div"> {
  variant?: "error" | "warning" | "success" | "info"
  title?: string
}

const PWAlert = React.forwardRef<HTMLDivElement, PWAlertProps>(
  ({ className, variant = "info", title, children, ...props }, ref) => {
    const variantStyles = {
      error: {
        bg: "#ffe3e8",
        titleBg: "#d22852",
        linkColor: "#d22852",
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
              fontSize: "var(--pw-text-md)",
              color: "#ffffff"
            }}
          >
            {title}
          </div>
        )}
        <div
          className="px-4 py-3"
          style={{
            fontSize: "var(--pw-text-sm)",
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

