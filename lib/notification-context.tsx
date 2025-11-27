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

// シードデータ用の初期通知（デモ用）
const SEED_NOTIFICATION: Notification = {
  id: "seed_notification_001",
  jobId: "1",
  jobTitle: "大手ECサイトのフロントエンド刷新案件",
  oldStatus: "応募済み",
  newStatus: "面談調整中",
  timestamp: new Date().toISOString(),
}

// 初期通知が設定済みかどうかを確認するキー
const SEED_NOTIFICATION_INITIALIZED_KEY = "seed_notification_initialized"

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // ページロード時にlocalStorageから通知を復元、または初期通知を設定
  useEffect(() => {
    const stored = localStorage.getItem("notifications")
    const isInitialized = localStorage.getItem(SEED_NOTIFICATION_INITIALIZED_KEY)

    if (stored) {
      try {
        setNotifications(JSON.parse(stored))
      } catch (error) {
        console.error("Failed to parse notifications:", error)
      }
    } else if (!isInitialized) {
      // 初回アクセス時：シード通知を1件追加
      const initialNotification = {
        ...SEED_NOTIFICATION,
        timestamp: new Date().toISOString(), // 現在時刻を設定
      }
      setNotifications([initialNotification])
      localStorage.setItem(SEED_NOTIFICATION_INITIALIZED_KEY, "true")
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

