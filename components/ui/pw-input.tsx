/**
 * PRO WORKS 入力窓コンポーネント
 * UI仕様書: 各要素 > 入力窓
 */

import * as React from "react"
import { cn } from "@/lib/utils"

interface PWInputProps extends React.ComponentProps<"input"> {
  error?: boolean
  errorMessage?: string
  leftIcon?: React.ReactNode
}

const PWInput = React.forwardRef<HTMLInputElement, PWInputProps>(
  ({ className, type, error, errorMessage, leftIcon, ...props }, ref) => {
    const errorId = errorMessage ? `${props.id}-error` : undefined

    return (
      <div className="w-full">
        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-0 top-0 h-full flex items-center justify-center px-3"
              style={{
                color: "var(--pw-text-gray)",
                borderRight: "1px solid var(--pw-input-border)"
              }}
            >
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full py-2 text-sm transition-colors",
              leftIcon ? "pl-12 pr-3" : "px-3",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-[var(--pw-text-light-gray)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "focus-visible:outline-none",
              "rounded-[var(--pw-radius-sm)]",
              error
                ? "border border-red-500 bg-white focus:border-red-600"
                : "border border-[var(--pw-input-border)] bg-white focus:bg-[var(--pw-input-error-bg)] focus:border-[var(--pw-input-focus)]",
              className,
            )}
            ref={ref}
            aria-invalid={error}
            aria-describedby={errorId}
            {...props}
          />
        </div>
        {error && errorMessage && (
          <p
            id={errorId}
            className="mt-1 text-xs"
            style={{ color: "var(--pw-alert-error)" }}
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    )
  },
)
PWInput.displayName = "PWInput"

export { PWInput }

