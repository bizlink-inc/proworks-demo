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

// プロフィール未入力通知
export type ProfileIncompleteNotification = {
  id: string
  type: "profile_incomplete"
  missingFields: string[]
  tab: string // 遷移先タブ（work-history | preferences）
  timestamp: string
}

// 統合された通知型
export type Notification = StatusChangeNotification | RecommendedNotification | ProfileIncompleteNotification

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
  fetchProfileIncompleteNotification: () => Promise<void>
  isLoading: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// シードデータ用の初期通知
// ※APIから取得される通知と重複するため、空配列に設定
// ※通知はfetchRecommendedNotificationsで取得される
const SEED_NOTIFICATIONS: Notification[] = []

// 既読のおすすめ通知IDを保存するキー
const READ_RECOMMENDED_NOTIFICATIONS_KEY = "read_recommended_notifications"

// 初期通知が設定済みかどうかを確認するキー
const SEED_NOTIFICATION_INITIALIZED_KEY = "seed_notification_initialized"

// プロフィール未入力通知を閉じた時刻を保存するキー
const PROFILE_NOTIFICATION_DISMISSED_AT_KEY = "profile_notification_dismissed_at"

// プロフィール通知の再表示間隔（ミリ秒） - 1日
const PROFILE_NOTIFICATION_INTERVAL_MS = 24 * 60 * 60 * 1000

// 現在のユーザーIDを管理するキー
const CURRENT_USER_ID_KEY = "pw_current_user_id"

// 全通知関連のlocalStorageをクリア
const clearNotificationStorage = () => {
  localStorage.removeItem("notifications")
  localStorage.removeItem(READ_RECOMMENDED_NOTIFICATIONS_KEY)
  localStorage.removeItem(SEED_NOTIFICATION_INITIALIZED_KEY)
  localStorage.removeItem(PROFILE_NOTIFICATION_DISMISSED_AT_KEY)
  localStorage.removeItem("previous_application_status")
}

// ユーザー変更検出とクリア
const checkAndClearOnUserChange = (currentUserId: string): boolean => {
  const lastUserId = localStorage.getItem(CURRENT_USER_ID_KEY)
  if (lastUserId && lastUserId !== currentUserId) {
    console.log(`🔄 ユーザー変更検出: ${lastUserId} → ${currentUserId}、通知データをクリア`)
    clearNotificationStorage()
    localStorage.setItem(CURRENT_USER_ID_KEY, currentUserId)
    return true // クリアした
  }
  localStorage.setItem(CURRENT_USER_ID_KEY, currentUserId)
  return false // クリアしなかった
}

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

// プロフィール通知を閉じた時刻を取得
const getProfileNotificationDismissedAt = (): number | null => {
  try {
    const stored = localStorage.getItem(PROFILE_NOTIFICATION_DISMISSED_AT_KEY)
    if (stored) {
      return parseInt(stored, 10)
    }
  } catch (error) {
    console.error("Failed to parse profile notification dismissed at:", error)
  }
  return null
}

// プロフィール通知を閉じた時刻を保存
const saveProfileNotificationDismissedAt = () => {
  localStorage.setItem(PROFILE_NOTIFICATION_DISMISSED_AT_KEY, Date.now().toString())
}

// プロフィール通知を表示すべきか判定（1日経過したらtrue）
const shouldShowProfileNotification = (): boolean => {
  const dismissedAt = getProfileNotificationDismissedAt()
  if (dismissedAt === null) {
    return true // 一度も閉じていない場合は表示
  }
  const elapsed = Date.now() - dismissedAt
  return elapsed >= PROFILE_NOTIFICATION_INTERVAL_MS
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
  const [isUserChecked, setIsUserChecked] = useState(false)

  // 初期化時にユーザーIDを確認し、変更があればlocalStorageをクリア
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const response = await fetch("/api/me")
        if (response.ok) {
          const data = await response.json()
          const currentUserId = data.authUserId
          if (currentUserId) {
            const wasCleared = checkAndClearOnUserChange(currentUserId)
            if (wasCleared) {
              // クリアされた場合、空の状態から開始
              setNotifications([])
              setIsUserChecked(true)
              return
            }
          }
        }
      } catch (error) {
        // 未ログイン状態は無視
      }
      setIsUserChecked(true)
    }
    checkCurrentUser()
  }, [])

  // ページロード時にlocalStorageから通知を復元、または初期通知を設定
  // ユーザーチェック完了後に実行
  useEffect(() => {
    if (!isUserChecked) return

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
  }, [isUserChecked])

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

      // 推薦通知はAPIからの結果で置き換える（古いlocalStorageのデータをクリア）
      setNotifications((prev) => {
        // 推薦通知以外を保持（ステータス変更、プロフィール未入力など）
        const nonRecommendedNotifications = prev.filter((n) => n.type !== "recommended")
        return [...nonRecommendedNotifications, ...newNotifications]
      })
    } catch (error) {
      console.error("Error fetching recommended notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // プロフィール未入力通知を取得
  const fetchProfileIncompleteNotification = useCallback(async () => {
    // 1日経過していない場合はスキップ
    if (!shouldShowProfileNotification()) {
      return
    }

    try {
      const response = await fetch("/api/me")
      if (!response.ok) {
        return
      }

      const talent = await response.json()

      // プロフィール検証関数を動的にインポート
      const { checkRequiredFields, getProfileIncompleteTab } = await import("@/lib/utils/profile-validation")
      const missingFields = checkRequiredFields(talent)
      const tab = getProfileIncompleteTab(talent)

      if (missingFields.length > 0 && tab) {
        const profileNotification: ProfileIncompleteNotification = {
          id: "profile_incomplete",
          type: "profile_incomplete",
          missingFields,
          tab,
          timestamp: new Date().toISOString(),
        }

        setNotifications((prev) => {
          // 既に同じ通知がある場合は追加しない
          const existingProfileNotification = prev.find((n) => n.type === "profile_incomplete")
          if (existingProfileNotification) {
            return prev
          }
          return [...prev, profileNotification]
        })
      }
    } catch (error) {
      console.error("Error fetching profile incomplete notification:", error)
    }
  }, [])

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification])
  }

  const removeNotification = (id: string) => {
    const notification = notifications.find((n) => n.id === id)
    // おすすめ通知の場合は既読として保存
    if (notification?.type === "recommended") {
      saveReadRecommendedId(id)
    }
    // プロフィール未入力通知の場合は閉じた時刻を保存
    if (notification?.type === "profile_incomplete") {
      saveProfileNotificationDismissedAt()
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAllNotifications = () => {
    // 通知タイプごとに既読状態を保存
    notifications.forEach((n) => {
      if (n.type === "recommended") {
        saveReadRecommendedId(n.id)
      }
      if (n.type === "profile_incomplete") {
        saveProfileNotificationDismissedAt()
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
        fetchProfileIncompleteNotification,
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

