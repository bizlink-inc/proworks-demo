import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/applications",
}))

// Mock toast hook
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock hooks
vi.mock("@/hooks/use-application-status-monitor", () => ({
  useApplicationStatusMonitor: vi.fn(),
}))

vi.mock("@/hooks/use-withdrawal-check", () => ({
  useWithdrawalCheck: () => ({
    handleWithdrawalError: vi.fn(),
  }),
}))

// Global fetch mock
global.fetch = vi.fn()
