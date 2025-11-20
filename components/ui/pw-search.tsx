/**
 * PRO WORKS 検索フィールドコンポーネント
 * UI仕様書: 各要素 > 検索エリア
 */

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PWSearchProps extends Omit<React.ComponentProps<"input">, "type"> {
  onClear?: () => void
  showClearButton?: boolean
}

const PWSearch = React.forwardRef<HTMLInputElement, PWSearchProps>(
  ({ className, onClear, showClearButton = true, value, ...props }, ref) => {
    const hasClearButton = showClearButton && value && String(value).length > 0

    return (
      <div className="relative w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search
            className="w-4 h-4"
            style={{ color: "var(--pw-text-gray)" }}
          />
        </div>
        <input
          type="search"
          className={cn(
            "flex h-10 w-full pl-10 pr-10 py-2 text-sm transition-colors",
            "placeholder:text-[var(--pw-text-light-gray)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:outline-none",
            "rounded-[var(--pw-radius-sm)]",
            "border border-[var(--pw-border-lighter)] bg-white",
            "focus:bg-[var(--pw-bg-light-blue)] focus:border-[var(--pw-button-primary)]",
            className,
          )}
          ref={ref}
          value={value}
          role="searchbox"
          aria-label="検索"
          {...props}
        />
        {hasClearButton && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-sm hover:bg-[var(--pw-bg-light-blue)] transition-colors"
            aria-label="検索をクリア"
          >
            <X
              className="w-4 h-4"
              style={{ color: "var(--pw-text-gray)" }}
            />
          </button>
        )}
      </div>
    )
  },
)
PWSearch.displayName = "PWSearch"

export { PWSearch }

