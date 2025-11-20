"use client"

import { Bell } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/lib/notification-context"
import { Button } from "@/components/ui/button"
import { NotificationBadge } from "@/components/ui/notification-badge"

export function NotificationDropdown() {
  const { notifications, removeNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleNotificationClick = (id: string) => {
    removeNotification(id)
    setIsOpen(false)
    // マイページの応募済み案件タブに遷移
    router.push("/me?tab=applications")
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
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            style={{ backgroundColor: "var(--pw-overlay)" }}
          />

          {/* 通知パネル */}
          <div 
            className="absolute right-0 top-full mt-2 w-96 bg-white shadow-xl z-50"
            style={{
              borderRadius: "var(--pw-radius-sm)",
              border: "1px solid var(--pw-border-lighter)"
            }}
          >
            <div 
              className="p-4"
              style={{ borderBottom: "1px solid var(--pw-border-lighter)" }}
            >
              <h3 
                className="font-semibold"
                style={{
                  fontSize: "var(--pw-text-lg)",
                  color: "var(--pw-text-primary)"
                }}
              >
                通知
              </h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div 
                  className="p-8 text-center"
                  style={{
                    fontSize: "var(--pw-text-sm)",
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
                      className="p-4 cursor-pointer transition-colors hover:bg-[var(--pw-bg-light-blue)]"
                      onClick={() => handleNotificationClick(notification.id)}
                      style={{
                        borderTop: index === 0 ? "none" : "1px solid var(--pw-border-lighter)"
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p 
                            className="font-medium"
                            style={{
                              fontSize: "var(--pw-text-sm)",
                              color: "var(--pw-text-primary)"
                            }}
                          >
                            {notification.jobTitle}
                          </p>
                          <p 
                            className="mt-1"
                            style={{
                              fontSize: "var(--pw-text-sm)",
                              color: "var(--pw-text-gray)"
                            }}
                          >
                            ステータス：
                            <span style={{ color: "var(--pw-text-gray)" }}>{notification.oldStatus}</span>
                            {" → "}
                            <span 
                              className="font-semibold"
                              style={{ color: "var(--pw-text-link)" }}
                            >
                              {notification.newStatus}
                            </span>
                          </p>
                          <p 
                            className="mt-2"
                            style={{
                              fontSize: "var(--pw-text-xs)",
                              color: "var(--pw-text-light-gray)"
                            }}
                          >
                            {new Date(notification.timestamp).toLocaleString("ja-JP")}
                          </p>
                        </div>
                        <button
                          className="ml-2"
                          style={{
                            fontSize: "var(--pw-text-xs)",
                            color: "var(--pw-text-link)"
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNotificationClick(notification.id)
                          }}
                        >
                          確認
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

