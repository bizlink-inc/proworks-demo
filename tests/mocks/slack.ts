import { vi } from "vitest"

// Slack通知を記録する配列
export const capturedSlackNotifications: Array<{
  type: string
  payload: Record<string, unknown>
  timestamp: Date
}> = []

export const resetCapturedSlackNotifications = () => {
  capturedSlackNotifications.length = 0
}

// Slack通知関数のモック
export const mockSlackFunctions = {
  sendNewUserNotification: vi.fn().mockImplementation(async (data) => {
    capturedSlackNotifications.push({
      type: "new_user",
      payload: data,
      timestamp: new Date(),
    })
  }),
  sendProfileCompleteNotification: vi.fn().mockImplementation(async (data) => {
    capturedSlackNotifications.push({
      type: "profile_complete",
      payload: data,
      timestamp: new Date(),
    })
  }),
  sendApplicationNotification: vi.fn().mockImplementation(async (data) => {
    capturedSlackNotifications.push({
      type: "application",
      payload: data,
      timestamp: new Date(),
    })
  }),
  sendInterviewReminderNotification: vi.fn().mockImplementation(async (data) => {
    capturedSlackNotifications.push({
      type: "interview_reminder",
      payload: data,
      timestamp: new Date(),
    })
  }),
}

export const setupSlackMocks = () => {
  vi.mock("@/lib/slack", () => mockSlackFunctions)
}

// グローバルfetchのモック（Slack Webhook用）
export const setupFetchMock = () => {
  const originalFetch = global.fetch

  global.fetch = vi.fn().mockImplementation(async (url, options) => {
    // Slack Webhook URLへのリクエストをモック
    if (typeof url === "string" && url.includes("hooks.slack.com")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
        text: async () => "ok",
      }
    }

    // その他のリクエストは元のfetchを使用
    return originalFetch(url, options)
  })

  return () => {
    global.fetch = originalFetch
  }
}
