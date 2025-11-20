/**
 * PRO WORKS セレクト（ドロップダウン）コンポーネント
 * UI仕様書: 各要素 > ドロップダウン
 */

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PWSelectProps extends React.ComponentProps<"select"> {
  label?: string
  error?: boolean
  errorMessage?: string
}

const PWSelect = React.forwardRef<HTMLSelectElement, PWSelectProps>(
  ({ className, label, error, errorMessage, children, ...props }, ref) => {
    const errorId = errorMessage ? `${props.id}-error` : undefined

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block mb-1 text-[var(--pw-text-primary)]"
            style={{ fontSize: "var(--pw-text-sm)" }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            className={cn(
              "flex h-10 w-full appearance-none px-3 py-2 pr-10 text-sm transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              "rounded-[var(--pw-radius-sm)]",
              error
                ? "border border-red-500 bg-red-50 focus:border-red-600 focus-visible:ring-red-500"
                : "border border-[var(--pw-border-gray)] bg-white focus:bg-[var(--pw-bg-light-blue)] focus:border-[var(--pw-button-primary)] focus-visible:ring-[var(--pw-button-primary)]",
              className,
            )}
            ref={ref}
            aria-invalid={error}
            aria-describedby={errorId}
            {...props}
          >
            {children}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown
              className="w-4 h-4"
              style={{ color: "var(--pw-text-gray)" }}
            />
          </div>
        </div>
        {error && errorMessage && (
          <p
            id={errorId}
            className="mt-1 text-xs text-red-600"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    )
  },
)
PWSelect.displayName = "PWSelect"

export { PWSelect }

