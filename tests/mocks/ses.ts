import { vi } from "vitest"

// AWS SES クライアントのモック
export const mockSESClient = {
  send: vi.fn().mockResolvedValue({
    MessageId: "test-message-id-" + Date.now(),
    $metadata: {
      httpStatusCode: 200,
    },
  }),
}

// メール送信のモック
export const mockSendEmail = vi.fn().mockResolvedValue({
  MessageId: "test-message-id",
})

// SESモジュールのセットアップ
export const setupSESMocks = () => {
  vi.mock("@aws-sdk/client-ses", () => ({
    SESClient: vi.fn(() => mockSESClient),
    SendEmailCommand: vi.fn((params) => params),
  }))
}

// 送信されたメールを記録するヘルパー
export const capturedEmails: Array<{
  to: string
  subject: string
  body: string
}> = []

export const resetCapturedEmails = () => {
  capturedEmails.length = 0
}

// メール送信関数のモック（lib/email.ts用）
export const mockEmailFunctions = {
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendEmailChangeVerification: vi.fn().mockResolvedValue(undefined),
  sendApplicationEmail: vi.fn().mockResolvedValue(undefined),
  sendApplicationCancelEmail: vi.fn().mockResolvedValue(undefined),
  sendWithdrawEmail: vi.fn().mockResolvedValue(undefined),
  sendContactConfirmEmail: vi.fn().mockResolvedValue(undefined),
  sendAiMatchNotificationEmail: vi.fn().mockResolvedValue(undefined),
  sendStaffRecommendNotificationEmail: vi.fn().mockResolvedValue(undefined),
  sendInterviewConfirmedEmail: vi.fn().mockResolvedValue(undefined),
}

export const setupEmailMocks = () => {
  vi.mock("@/lib/email", () => mockEmailFunctions)
}
