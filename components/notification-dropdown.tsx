"use client"

import { Bell, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useNotifications, Notification } from "@/lib/notification-context"
import { useApplicationStatusMonitor } from "@/hooks/use-application-status-monitor"
import { NotificationBadge } from "@/components/ui/notification-badge"

// 相対日付をフォーマット（昨日、火曜日、10.23 など）
const formatRelativeDate = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.floor((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "今日"
  } else if (diffDays === 1) {
    return "昨日"
  } else if (diffDays >= 2 && diffDays <= 6) {
    const weekdays = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"]
    return weekdays[date.getDay()]
  } else {
    return `${date.getMonth() + 1}.${date.getDate()}`
  }
}

// 通知のタイトルを取得
const getNotificationTitle = (notification: Notification): string => {
  if (notification.type === "status_change") {
    return "面談予定が確定しました。"
  } else if (notification.type === "recommended") {
    if (notification.recommendationType === "staff") {
      return "担当者からあなたに向けた案件オファーが届いています。"
    } else {
      return "あなたのスキルにマッチする案件をAIが見つけました！"
    }
  }
  return ""
}

// 通知の説明文を取得（status_changeのみ）
const getNotificationDescription = (notification: Notification): string | null => {
  if (notification.type === "status_change") {
    return "ご登録いただいているメールアドレス宛にメールを送信しましたのでご確認ください。"
  }
  return null
}

export const NotificationDropdown = () => {
  const { notifications, removeNotification, fetchRecommendedNotifications } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // ステータス変更を監視
  useApplicationStatusMonitor()

  // 初回マウント時におすすめ通知を取得
  useEffect(() => {
    fetchRecommendedNotifications()
  }, [fetchRecommendedNotifications])

  // 通知を新しい順にソート
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const handleNotificationClick = (notification: Notification) => {
    removeNotification(notification.id)
    setIsOpen(false)

    if (notification.type === "recommended") {
      // 担当者おすすめ・AIマッチ両方とも案件詳細モーダルを開く
      router.push(`/?jobId=${notification.jobId}`)
    } else {
      // ステータス変更は応募履歴ページへ遷移し、対象案件の詳細を開く
      router.push(`/applications?jobId=${notification.jobId}`)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* ベルアイコン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full transition-colors"
        style={{
          color: "var(--pw-text-navy)"
        }}
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4">
            <NotificationBadge count={notifications.length} />
          </span>
        )}
      </button>

      {/* 通知ドロップダウン */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 shadow-xl z-50 overflow-hidden"
          style={{
            width: "360px",
            borderRadius: "8px"
          }}
        >
          {/* ヘッダー */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{
              backgroundColor: "#d22852",
              color: "#ffffff"
            }}
          >
            <h3
              className="font-semibold"
              style={{ fontSize: "14px" }}
            >
              {notifications.length > 0 ? `${notifications.length}件の新しい通知` : "通知"}
            </h3>
            <button
              onClick={handleClose}
              className="hover:opacity-80 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 通知リスト */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div
                className="p-8 text-center"
                style={{
                  fontSize: "13px",
                  color: "#666666",
                  backgroundColor: "#fce4ec"
                }}
              >
                通知はありません
              </div>
            ) : (
              <div>
                {sortedNotifications.map((notification, index) => {
                  // 偶数行（0, 2, 4...）は濃いピンク、奇数行（1, 3, 5...）は薄いピンク
                  const isEvenRow = index % 2 === 0
                  const backgroundColor = isEvenRow ? "#f8bbd9" : "#fce4ec"
                  
                  return (
                    <div
                      key={notification.id}
                      style={{
                        backgroundColor
                      }}
                    >
                      {/* コンテンツ部分 */}
                      <div className="px-4 py-3 relative">
                        {/* 日付（右上） */}
                        <div
                          className="absolute top-3 right-4"
                          style={{
                            fontSize: "12px",
                            color: "#888888"
                          }}
                        >
                          {formatRelativeDate(notification.timestamp)}
                        </div>

                        {/* タイトル */}
                        <p
                          className="font-bold pr-16"
                          style={{
                            fontSize: "13px",
                            color: "#333333",
                            lineHeight: "1.5"
                          }}
                        >
                          {getNotificationTitle(notification)}
                        </p>

                        {/* 説明文（status_changeのみ） */}
                        {getNotificationDescription(notification) && (
                          <p
                            className="mt-1"
                            style={{
                              fontSize: "12px",
                              color: "#333333",
                              lineHeight: "1.5"
                            }}
                          >
                            {getNotificationDescription(notification)}
                          </p>
                        )}

                        {/* 確認リンク */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNotificationClick(notification)
                          }}
                          className="mt-2 underline text-left"
                          style={{
                            fontSize: "12px",
                            color: "#d22852"
                          }}
                        >
                          確認する
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
