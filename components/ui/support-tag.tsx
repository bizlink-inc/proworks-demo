import * as React from "react"

type SupportTagProps = {
  variant?: "required" | "optional"
  children: React.ReactNode
  className?: string
}

const SupportTag = React.forwardRef<HTMLSpanElement, SupportTagProps>(
  ({ variant = "required", children, className }, ref) => {
    const isRequired = variant === "required"

    const baseStyle =
      "inline-block px-3 py-1 text-sm font-medium leading-none select-none"

    const style = isRequired
      ? `${baseStyle} text-white`
      : `${baseStyle} text-[var(--pw-text-gray)]`

    const bg = isRequired ? "backgroundColor: 'var(--pw-support-required)'" : "backgroundColor: 'var(--pw-support-optional)'"

    return (
      // Using style prop for backgroundColor so it reads CSS variables correctly
      // and keeps Tailwind usage minimal for dynamic colors.
      <span
        ref={ref}
        className={`${style} ${className || ""}`}
        style={isRequired ? { backgroundColor: "var(--pw-support-required)" } : { backgroundColor: "var(--pw-support-optional)" }}
      >
        {children}
      </span>
    )
  },
)

SupportTag.displayName = "SupportTag"

export { SupportTag }


