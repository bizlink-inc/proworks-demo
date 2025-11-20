/**
 * PRO WORKS カードコンポーネント
 * UI仕様書: 各要素 > 案件カード
 */

import * as React from "react"
import { cn } from "@/lib/utils"

interface PWCardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "highlighted"
}

const PWCard = React.forwardRef<HTMLDivElement, PWCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-[var(--pw-radius-sm)] border border-[var(--pw-border-lighter)] shadow-sm transition-shadow hover:shadow-md",
          variant === "highlighted" && "border-[var(--pw-border-primary)] border-2",
          className
        )}
        {...props}
      />
    )
  }
)
PWCard.displayName = "PWCard"

const PWCardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("p-4", className)}
        style={{ borderBottom: "1px solid var(--pw-border-light)" }}
        {...props}
      />
    )
  }
)
PWCardHeader.displayName = "PWCardHeader"

const PWCardTitle = React.forwardRef<HTMLHeadingElement, React.ComponentProps<"h3">>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          "font-semibold leading-none tracking-tight",
          "text-[var(--pw-text-primary)]",
          className
        )}
        style={{ fontSize: "var(--pw-text-lg)" }}
        {...props}
      />
    )
  }
)
PWCardTitle.displayName = "PWCardTitle"

const PWCardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("p-4", className)}
        {...props}
      />
    )
  }
)
PWCardContent.displayName = "PWCardContent"

const PWCardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between p-4",
          className
        )}
        style={{ borderTop: "1px solid var(--pw-border-light)" }}
        {...props}
      />
    )
  }
)
PWCardFooter.displayName = "PWCardFooter"

const PWCardBadge = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span"> & {
  variant?: "default" | "success" | "warning" | "error"
}>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-[var(--pw-bg-light-blue)] text-[var(--pw-text-primary)]",
      success: "bg-[var(--pw-alert-success)] text-white",
      warning: "bg-[var(--pw-alert-warning)] text-white",
      error: "bg-[var(--pw-alert-error)] text-white",
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-1 rounded-[var(--pw-radius-sm)] text-xs font-medium",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)
PWCardBadge.displayName = "PWCardBadge"

export {
  PWCard,
  PWCardHeader,
  PWCardTitle,
  PWCardContent,
  PWCardFooter,
  PWCardBadge,
}

