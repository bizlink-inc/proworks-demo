import { vi } from "vitest"

// テストユーザーデータ
export const testUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "テスト太郎",
  lastName: "テスト",
  firstName: "太郎",
  phone: "090-1234-5678",
  birthDate: "1990-01-01",
}

export const testAdminUser = {
  email: "admin@example.com",
  password: "admin123",
}

// 認証済みセッションのモック
export const createMockSession = (userId: string = testUser.id) => ({
  user: {
    id: userId,
    email: testUser.email,
    name: testUser.name,
  },
  session: {
    id: "test-session-id",
    userId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
  },
})

// 認証ミドルウェアのモック
export const mockAuthSession = (userId: string = testUser.id) => {
  const session = createMockSession(userId)

  vi.mock("@/lib/auth", () => ({
    auth: {
      api: {
        getSession: vi.fn().mockResolvedValue(session),
      },
    },
  }))

  return session
}

// 未認証状態のモック
export const mockUnauthenticated = () => {
  vi.mock("@/lib/auth", () => ({
    auth: {
      api: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    },
  }))
}

// 管理者セッションのモック
export const mockAdminSession = () => {
  // Cookieにadmin_sessionを設定するモック
  return {
    isAdmin: true,
    email: testAdminUser.email,
  }
}
