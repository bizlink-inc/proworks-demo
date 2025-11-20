/**
 * フォームセクション共通コンポーネント
 * 職歴・資格のデザインを踏襲した白カードベースのセクション
 */

import * as React from "react"
import { cn } from "@/lib/utils"

interface FormSectionProps extends React.ComponentProps<"div"> {
  title?: string
  description?: string
}

export const FormSection = React.forwardRef<HTMLDivElement, FormSectionProps>(
  ({ className, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("bg-white rounded-[var(--pw-radius-md)] p-8", className)}
        style={{
          border: "1px solid var(--pw-border-lighter)",
          boxShadow: "0 2px 8px var(--pw-shadow)",
        }}
        {...props}
      >
        {(title || description) && (
          <div className="mb-6">
            {title && (
              <h2
                className="font-semibold mb-2"
                style={{
                  fontSize: "var(--pw-text-lg)",
                  color: "var(--pw-text-primary)",
                }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className="text-[var(--pw-text-gray)]"
                style={{ fontSize: "var(--pw-text-sm)" }}
              >
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    )
  }
)
FormSection.displayName = "FormSection"

