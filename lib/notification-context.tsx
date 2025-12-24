"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

// 基本の通知情報
type BaseNotification = {
  id: string
  jobId: string
  jobTitle: string
  timestamp: string
}

// ステータス変更通知
export type StatusChangeNotification = BaseNotification & {
  type: "status_change"
  oldStatus: string
  newStatus: string
}

// おすすめ案件通知
export type RecommendedNotification = BaseNotification & {
  type: "recommended"
  recommendationType: "staff" | "program_match"  // 担当者おすすめ or プログラムマッチ
}

// 統合された通知型
export type Notification = StatusChangeNotification | RecommendedNotification

// 後方互換性のためのヘルパー型（旧形式のNotification）
export type LegacyNotification = {
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
  fetchRecommendedNotifications: () => Promise<void>
  isLoading: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// シードデータ用の初期通知（デモ用）
// 日付を生成するヘルパー関数
const getDaysAgo = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

// 3種類のシードデータ
const SEED_NOTIFICATIONS: Notification[] = [
  // 1. ステータス変更通知（昨日）
  {
    id: "seed_notification_001",
    type: "status_change",
    jobId: "1",
    jobTitle: "大手ECサイトのフロントエンド刷新案件",
    oldStatus: "応募済み",
    newStatus: "面談調整中",
    timestamp: getDaysAgo(1),
  },
  // 2. 担当者おすすめ通知（2日前）
  {
    id: "seed_notification_002",
    type: "recommended",
    jobId: "2",
    jobTitle: "金融系システムのバックエンド開発",
    recommendationType: "staff",
    timestamp: getDaysAgo(2),
  },
  // 3. AIマッチ通知（3日前）
  {
    id: "seed_notification_003",
    type: "recommended",
    jobId: "3",
    jobTitle: "SaaS製品のフルスタック開発",
    recommendationType: "program_match",
    timestamp: getDaysAgo(3),
  },
]

// 既読のおすすめ通知IDを保存するキー
const READ_RECOMMENDED_NOTIFICATIONS_KEY = "read_recommended_notifications"

// 初期通知が設定済みかどうかを確認するキー
const SEED_NOTIFICATION_INITIALIZED_KEY = "seed_notification_initialized"

// 既読のおすすめ通知IDを取得
const getReadRecommendedIds = (): Set<string> => {
  try {
    const stored = localStorage.getItem(READ_RECOMMENDED_NOTIFICATIONS_KEY)
    if (stored) {
      return new Set(JSON.parse(stored))
    }
  } catch (error) {
    console.error("Failed to parse read recommended notifications:", error)
  }
  return new Set()
}

// 既読のおすすめ通知IDを保存
const saveReadRecommendedId = (id: string) => {
  const readIds = getReadRecommendedIds()
  readIds.add(id)
  localStorage.setItem(READ_RECOMMENDED_NOTIFICATIONS_KEY, JSON.stringify([...readIds]))
}

// 旧形式の通知を新形式に変換
const migrateNotification = (notification: Notification | LegacyNotification): Notification => {
  if ("type" in notification) {
    return notification
  }
  // 旧形式の通知をステータス変更通知に変換
  return {
    ...notification,
    type: "status_change",
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // ページロード時にlocalStorageから通知を復元、または初期通知を設定
  useEffect(() => {
    const stored = localStorage.getItem("notifications")
    const isInitialized = localStorage.getItem(SEED_NOTIFICATION_INITIALIZED_KEY)

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as (Notification | LegacyNotification)[]
        // 旧形式の通知を新形式に変換
        setNotifications(parsed.map(migrateNotification))
      } catch (error) {
        console.error("Failed to parse notifications:", error)
      }
    } else if (!isInitialized) {
      // 初回アクセス時：シード通知を追加（デモ用3種類）
      setNotifications(SEED_NOTIFICATIONS)
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

  // おすすめ案件通知をAPIから取得
  const fetchRecommendedNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/recommended")
      if (!response.ok) {
        console.error("Failed to fetch recommended notifications:", response.status)
        return
      }

      const data = await response.json()
      if (!data.notifications || !Array.isArray(data.notifications)) {
        return
      }

      const readIds = getReadRecommendedIds()
      const newNotifications: RecommendedNotification[] = data.notifications
        .filter((n: RecommendedNotification) => !readIds.has(n.id))

      if (newNotifications.length > 0) {
        setNotifications((prev) => {
          // 重複を避けるため、既存の通知IDを取得
          const existingIds = new Set(prev.map((n) => n.id))
          const uniqueNewNotifications = newNotifications.filter(
            (n) => !existingIds.has(n.id)
          )
          return [...prev, ...uniqueNewNotifications]
        })
      }
    } catch (error) {
      console.error("Error fetching recommended notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification])
  }

  const removeNotification = (id: string) => {
    // おすすめ通知の場合は既読として保存
    const notification = notifications.find((n) => n.id === id)
    if (notification?.type === "recommended") {
      saveReadRecommendedId(id)
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAllNotifications = () => {
    // おすすめ通知を全て既読として保存
    notifications.forEach((n) => {
      if (n.type === "recommended") {
        saveReadRecommendedId(n.id)
      }
    })
    setNotifications([])
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
        fetchRecommendedNotifications,
        isLoading,
      }}
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

