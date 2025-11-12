"use client"

import { Bell } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/lib/notification-context"
import { Button } from "@/components/ui/button"

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
        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* 通知ドロップダウン */}
      {isOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* 通知パネル */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">通知</h3>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  通知はありません
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">
                            {notification.jobTitle}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            ステータス：
                            <span className="text-gray-500">{notification.oldStatus}</span>
                            {" → "}
                            <span className="font-semibold text-blue-600">
                              {notification.newStatus}
                            </span>
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(notification.timestamp).toLocaleString("ja-JP")}
                          </p>
                        </div>
                        <button
                          className="ml-2 text-xs text-blue-600 hover:text-blue-700"
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

