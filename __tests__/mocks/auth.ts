/**
 * 認証モック
 * Better Auth のセッション情報をモック化
 */

import type { Session } from "@/lib/auth";

// テスト用のデフォルトセッション
export const mockSession: Session = {
  user: {
    id: "test-user-123",
    name: "テスト 太郎",
    email: "test@example.com",
    emailVerified: true,
    image: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
  session: {
    id: "test-session-123",
    expiresAt: new Date(Date.now() + 86400000), // 24時間後
    token: "test-token-abc123",
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: "127.0.0.1",
    userAgent: "Jest Test",
    userId: "test-user-123",
  },
};

// モック関数
let currentSession: Session | null = mockSession;

/**
 * getSession のモック実装
 */
export const mockGetSession = jest.fn(async () => currentSession);

/**
 * requireAuth のモック実装
 */
export const mockRequireAuth = jest.fn(async () => {
  if (!currentSession) {
    throw new Error("Unauthorized");
  }
  return currentSession;
});

/**
 * 認証済み状態に設定
 */
export const setAuthenticated = (session: Session = mockSession) => {
  currentSession = session;
  mockGetSession.mockResolvedValue(session);
  mockRequireAuth.mockResolvedValue(session);
};

/**
 * 未認証状態に設定
 */
export const setUnauthenticated = () => {
  currentSession = null;
  mockGetSession.mockResolvedValue(null);
  mockRequireAuth.mockRejectedValue(new Error("Unauthorized"));
};

/**
 * モックをリセット
 */
export const resetAuthMocks = () => {
  currentSession = mockSession;
  mockGetSession.mockClear();
  mockRequireAuth.mockClear();
  mockGetSession.mockResolvedValue(mockSession);
  mockRequireAuth.mockResolvedValue(mockSession);
};

/**
 * カスタムユーザーでセッションを作成
 */
export const createMockSession = (overrides: Partial<Session["user"]> = {}): Session => ({
  user: {
    ...mockSession.user,
    ...overrides,
  },
  session: {
    ...mockSession.session,
    userId: overrides.id || mockSession.user.id,
  },
});
