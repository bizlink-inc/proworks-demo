"use client"

import { Bell, X } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/lib/notification-context"
import { Button } from "@/components/ui/button"
import { NotificationBadge } from "@/components/ui/notification-badge"

export const NotificationDropdown = () => {
  const { notifications, removeNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleNotificationClick = (id: string) => {
    removeNotification(id)
    setIsOpen(false)
    // マイページの応募済み案件タブに遷移
    router.push("/me?tab=applications")
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
        <>
          {/* 背景オーバーレイは表示しない（UI仕様書の画像に合わせる） */}

          {/* 通知パネル（アラートデザインを適用） */}
          <div 
            className="absolute right-0 top-full mt-2 shadow-xl z-50 overflow-hidden"
            style={{
              width: "400px",
              borderRadius: "var(--pw-radius-sm)",
              border: "1px solid var(--pw-border-lighter)",
              backgroundColor: "#ffffff"
            }}
          >
            {/* ヘッダー（アラートのタイトル台紙スタイル） */}
            <div 
              className="px-4 py-3 flex items-center justify-between"
              style={{
                backgroundColor: "#d22852",
                color: "#ffffff"
              }}
            >
              <h3 
                className="font-semibold"
                style={{
                  fontSize: "15px"
                }}
              >
                {notifications.length > 0 ? `${notifications.length}件の新しい通知` : "通知"}
              </h3>
              <button
                onClick={handleClose}
                className="hover:opacity-80 transition-opacity"
                style={{
                  color: "#ffffff"
                }}
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
                    color: "var(--pw-text-gray)"
                  }}
                >
                  通知はありません
                </div>
              ) : (
                <div>
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className="p-4"
                      style={{
                        backgroundColor: "#ffe3e8",
                        borderTop: index === 0 ? "none" : "1px solid #fecfd7"
                      }}
                    >
                      <div className="flex flex-col gap-2">
                        {/* 案件名 */}
                        <p 
                          className="font-medium"
                          style={{
                            fontSize: "13px",
                            color: "#000000"
                          }}
                        >
                          {notification.jobTitle}
                        </p>
                        
                        {/* ステータス変更 */}
                        <p 
                          style={{
                            fontSize: "13px",
                            color: "#000000"
                          }}
                        >
                          ステータス：
                          <span>{notification.oldStatus}</span>
                          {" → "}
                          <span className="font-semibold">
                            {notification.newStatus}
                          </span>
                        </p>

                        {/* タイムスタンプ */}
                        <p 
                          style={{
                            fontSize: "12px",
                            color: "#686868"
                          }}
                        >
                          {new Date(notification.timestamp).toLocaleString("ja-JP", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </p>

                        {/* 確認リンク */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNotificationClick(notification.id)
                          }}
                          className="underline text-left"
                          style={{
                            fontSize: "13px",
                            color: "#d22852"
                          }}
                        >
                          確認する
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

