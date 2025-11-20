import * as React from "react"

type NotificationBadgeProps = {
  count?: number
  size?: number
  className?: string
}

const NotificationBadge = ({ count = 0, size = 16, className = "" }: NotificationBadgeProps) => {
  if (!count) return null
  const display = count > 99 ? "99+" : String(count)

  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full text-white ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--pw-alert-error)",
        fontSize: Math.max(10, Math.floor(size / 2)),
        lineHeight: 1,
        padding: "0 4px",
      }}
    >
      {display}
    </span>
  )
}

export { NotificationBadge }


