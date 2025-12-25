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
const EMAIL_SENT_KEY = "interview_confirmed_email_sent"

// メール送信済みの案件IDを管理
const getEmailSentJobIds = (): Set<string> => {
  try {
    const data = localStorage.getItem(EMAIL_SENT_KEY)
    return data ? new Set(JSON.parse(data)) : new Set()
  } catch {
    return new Set()
  }
}

const markEmailSent = (jobId: string): void => {
  const sentIds = getEmailSentJobIds()
  sentIds.add(jobId)
  localStorage.setItem(EMAIL_SENT_KEY, JSON.stringify([...sentIds]))
}

// 面談予定確定メールを送信
const sendInterviewConfirmedNotification = async (jobId: string, jobTitle: string): Promise<void> => {
  console.log(`📧 [クライアント] 面談予定確定メール送信処理開始: jobId=${jobId}`)

  // 既に送信済みの場合はスキップ
  if (getEmailSentJobIds().has(jobId)) {
    console.log(`📧 [クライアント] 既に送信済みのためスキップ: jobId=${jobId}`)
    return
  }

  try {
    console.log(`📧 [クライアント] API呼び出し中...`)
    const res = await fetch("/api/notifications/interview-confirmed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobId, jobTitle }),
    })

    if (res.ok) {
      // 送信成功した場合、送信済みとしてマーク
      markEmailSent(jobId)
      console.log(`📧 [クライアント] メール送信成功: jobId=${jobId}`)
    } else {
      const errorData = await res.json().catch(() => ({}))
      console.error(`📧 [クライアント] メール送信失敗: status=${res.status}`, errorData)
    }
  } catch (error) {
    console.error("📧 [クライアント] メール送信エラー:", error)
  }
}

export function useApplicationStatusMonitor(prefetchedApplications?: Application[]) {
  const { addNotification } = useNotifications()

  useEffect(() => {
    const checkStatusChanges = async () => {
      console.log("📋 [ステータス監視] チェック開始")

      try {
        let currentApplications: Application[]

        // 親コンポーネントからデータを受け取った場合はAPIを呼ばない
        if (prefetchedApplications && prefetchedApplications.length > 0) {
          console.log("📋 [ステータス監視] 親コンポーネントからデータを受信")
          currentApplications = prefetchedApplications.map(app => ({
            id: app.id,
            jobId: app.jobId,
            jobTitle: app.jobTitle,
            status: app.status,
          }))
        } else {
          // フォールバック: APIから取得
          const res = await fetch("/api/applications/me")
          if (!res.ok) {
            console.log("📋 [ステータス監視] API応答エラー:", res.status)
            return
          }
          currentApplications = await res.json()
        }

        console.log(`📋 [ステータス監視] 現在の応募件数: ${currentApplications.length}`)

        // localStorageから前回の状態を取得
        const storedData = localStorage.getItem(STORAGE_KEY)
        if (!storedData) {
          // 初回アクセス：現在の状態を保存して終了
          console.log("📋 [ステータス監視] 初回アクセス: 状態を保存")
          localStorage.setItem(STORAGE_KEY, JSON.stringify(currentApplications))
          return
        }

        const previousApplications: Application[] = JSON.parse(storedData)
        console.log(`📋 [ステータス監視] 前回の応募件数: ${previousApplications.length}`)

        // ステータス変更をチェック（「面談予定」への変更のみ通知）
        currentApplications.forEach((current) => {
          const previous = previousApplications.find((p) => p.jobId === current.jobId)

          if (previous) {
            console.log(`📋 [ステータス監視] jobId=${current.jobId}: 前回=${previous.status} → 現在=${current.status}`)
          }

          // 「面談予定」への変更のみ通知
          const isMeetingConfirmed = current.status === "面談予定"
          if (previous && previous.status !== current.status && isMeetingConfirmed) {
            console.log(`📋 [ステータス監視] 面談予定への変更を検出! jobId=${current.jobId}`)

            // ステータスが「面談確定」に変更された場合、通知を追加
            addNotification({
              id: `${current.jobId}-${Date.now()}`,
              type: "status_change",
              jobId: current.jobId,
              jobTitle: current.jobTitle,
              oldStatus: previous.status,
              newStatus: current.status,
              timestamp: new Date().toISOString(),
            })

            // メール送信（重複防止付き）
            sendInterviewConfirmedNotification(current.jobId, current.jobTitle)
          }
        })

        // 現在の状態を保存
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentApplications))
        console.log("📋 [ステータス監視] チェック完了、状態を保存")
      } catch (error) {
        console.error("📋 [ステータス監視] エラー:", error)
      }
    }

    checkStatusChanges()
  }, [addNotification, prefetchedApplications])
}

