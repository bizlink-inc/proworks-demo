"use client"

import { useEffect } from "react"
import { useNotifications } from "@/lib/notification-context"

type Application = {
  id: string
  jobId: string
  jobTitle: string
  status: string
}

const STORAGE_KEY = "previous_application_status"

export function useApplicationStatusMonitor() {
  const { addNotification } = useNotifications()

  useEffect(() => {
    const checkStatusChanges = async () => {
      try {
        // 現在の応募状況を取得
        const res = await fetch("/api/applications/me")
        if (!res.ok) return

        const currentApplications: Application[] = await res.json()

        // localStorageから前回の状態を取得
        const storedData = localStorage.getItem(STORAGE_KEY)
        if (!storedData) {
          // 初回アクセス：現在の状態を保存して終了
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentApplications))
          return
        }

        const previousApplications: Application[] = JSON.parse(storedData)

        // ステータス変更をチェック
        currentApplications.forEach((current) => {
          const previous = previousApplications.find((p) => p.jobId === current.jobId)

          if (previous && previous.status !== current.status) {
            // ステータスが変更された場合、通知を追加
            addNotification({
              id: `${current.jobId}-${Date.now()}`,
              jobId: current.jobId,
              jobTitle: current.jobTitle,
              oldStatus: previous.status,
              newStatus: current.status,
              timestamp: new Date().toISOString(),
            })
          }
        })

        // 現在の状態を保存
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentApplications))
      } catch (error) {
        console.error("Failed to check application status changes:", error)
      }
    }

    checkStatusChanges()
  }, [addNotification])
}

