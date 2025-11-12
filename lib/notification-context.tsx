"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export type Notification = {
  id: string
  jobId: string
  jobTitle: string
  oldStatus: string
  newStatus: string
  timestamp: string
}

type NotificationContextType = {
  notifications: Notification[]
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // ページロード時にlocalStorageから通知を復元
  useEffect(() => {
    const stored = localStorage.getItem("notifications")
    if (stored) {
      try {
        setNotifications(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to parse notifications:", error)
      }
    }
  }, [])

  // 通知が変更されたらlocalStorageに保存
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("notifications", JSON.stringify(notifications))
    } else {
      localStorage.removeItem("notifications")
    }
  }, [notifications])

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification])
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, clearAllNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}

