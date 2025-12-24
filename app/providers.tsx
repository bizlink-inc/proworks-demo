"use client"

import { NotificationProvider } from "@/lib/notification-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  )
}
