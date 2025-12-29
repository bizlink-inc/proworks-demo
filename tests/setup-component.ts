import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
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

// Mock window.location.reload (jsdomでは未実装)
Object.defineProperty(window, "location", {
  value: {
    ...window.location,
    reload: vi.fn(),
    href: "http://localhost:3000/applications",
  },
  writable: true,
})
