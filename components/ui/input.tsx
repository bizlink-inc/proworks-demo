import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[var(--pw-radius-sm)] border px-3 py-2 text-sm transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "border-[var(--pw-border-input)] bg-white placeholder:text-[var(--pw-text-light-gray)]",
          "focus-visible:outline-none focus:bg-[var(--pw-input-error-bg)] focus:border-[var(--pw-input-focus)]",
          "disabled:cursor-not-allowed disabled:bg-[#f2f2f2] disabled:text-[#999999]",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
