import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ApplicationsClient } from "@/components/applications-client"

// モックデータ
const mockUser = {
  id: "test-user-id",
  name: "テストユーザー",
  email: "test@example.com",
}

const mockJob = {
  id: "job-1",
  title: "React開発案件",
  features: ["フルリモート可"],
  position: ["フロントエンドエンジニア"],
  skills: ["React", "TypeScript"],
  description: "ECサイトのフロントエンド開発",
  rate: "800000",
  recruitmentStatus: "募集中",
}

const mockApplications = [
  {
    id: "app-1",
    jobId: "job-1",
    status: "応募済み",
    appliedAt: new Date().toISOString(),
    job: mockJob,
  },
  {
    id: "app-2",
    jobId: "job-2",
    status: "面談中",
    appliedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    job: {
      id: "job-2",
      title: "Java開発案件",
      features: [],
      position: ["バックエンドエンジニア"],
      skills: ["Java"],
      description: "基幹システム開発",
      rate: "700000",
      recruitmentStatus: "募集中",
    },
  },
]

// toastのモック関数を保持
const mockToast = vi.fn()

// 各テストで使用するモック関数
let mockFetch: ReturnType<typeof vi.fn>

// モックをオーバーライド
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// JobCard コンポーネントをモック（テスト対象はApplicationsClientの振る舞い）
vi.mock("@/components/job-card", () => ({
  JobCard: ({ job, onCancelApplication, applicationId, showApplicationStatus }: any) => (
    <div data-testid={`job-card-${job.id}`}>
      <span data-testid="job-title">{job.title}</span>
      <span data-testid="status">{job.applicationStatus}</span>
      {showApplicationStatus && job.applicationStatus === "応募済み" && (
        <button
          data-testid={`cancel-btn-${applicationId}`}
          onClick={() => {
            // 非同期関数のエラーをキャッチして無視（テストでは toast が呼ばれることを確認）
            onCancelApplication(applicationId).catch(() => {})
          }}
        >
          応募を取り消す
        </button>
      )}
    </div>
  ),
}))

// その他のモック
vi.mock("@/components/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

vi.mock("@/components/layouts", () => ({
  FullWidthLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}))

vi.mock("@/components/dashboard-filters", () => ({
  DashboardFilters: () => <div data-testid="filters">Filters</div>,
}))

vi.mock("@/components/job-detail-modal", () => ({
  JobDetailModal: () => null,
}))

vi.mock("@/components/ai-recommended-jobs-carousel", () => ({
  AiRecommendedJobsCarousel: () => null,
}))

vi.mock("@/lib/utils", () => ({
  mapApplicationStatusToDisplay: (status: string) => status,
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}))

describe("ApplicationsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    global.fetch = mockFetch

    // デフォルトのfetchモック（/api/me と /api/applications/me）
    mockFetch.mockImplementation((url: string) => {
      if (url === "/api/me") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser }),
        })
      }
      if (url === "/api/applications/me") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockApplications),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })
  })

  describe("応募取消し", () => {
    it("取消し成功時、一覧が更新される", async () => {
      // 初期状態で応募一覧をSSRで渡す
      render(
        <ApplicationsClient user={mockUser} initialApplications={mockApplications} />
      )

      // 応募済み案件が表示されていることを確認
      expect(screen.getByTestId("job-card-job-1")).toBeInTheDocument()
      expect(screen.getByTestId("cancel-btn-app-1")).toBeInTheDocument()

      // 取消しAPIが成功を返すようモック
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        // 取消しAPI
        if (url.includes("/api/applications/app-1") && options?.method === "PATCH") {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true }),
          })
        }
        // 一覧再取得（取消し後は app-1 がない状態を返す）
        if (url === "/api/applications/me") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockApplications[1]]), // app-1を除外
          })
        }
        if (url === "/api/me") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ user: mockUser }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      // 取り消しボタンをクリック
      fireEvent.click(screen.getByTestId("cancel-btn-app-1"))

      // ページがリロードされることを確認
      await waitFor(() => {
        expect(window.location.reload).toHaveBeenCalled()
      })
    })

    it("400エラー時、一覧が更新されエラーメッセージが表示される", async () => {
      render(
        <ApplicationsClient user={mockUser} initialApplications={mockApplications} />
      )

      // 取消しAPIが400エラーを返すようモック
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes("/api/applications/app-1") && options?.method === "PATCH") {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ error: "この応募は取り消せません" }),
          })
        }
        // 400エラー後の一覧再取得（ステータスが変わった状態）
        if (url === "/api/applications/me") {
          const updatedApplications = mockApplications.map((app) =>
            app.id === "app-1" ? { ...app, status: "面談調整中" } : app
          )
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(updatedApplications),
          })
        }
        if (url === "/api/me") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ user: mockUser }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      // 取り消しボタンをクリック
      fireEvent.click(screen.getByTestId("cancel-btn-app-1"))

      // エラートーストが表示されることを確認（400専用のハンドリング）
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "取り消しできません",
            variant: "destructive",
          })
        )
      })

      // 一覧が再取得されたことを確認
      await waitFor(() => {
        const applicationsMeCalls = mockFetch.mock.calls.filter(
          (call: any[]) => call[0] === "/api/applications/me"
        )
        expect(applicationsMeCalls.length).toBeGreaterThan(0)
      })
    })

    it("500エラー時、汎用エラーメッセージが表示される", async () => {
      // 未処理のエラーを抑制
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(
        <ApplicationsClient user={mockUser} initialApplications={mockApplications} />
      )

      // 取消しAPIが500エラーを返すようモック
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes("/api/applications/app-1") && options?.method === "PATCH") {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: "サーバーエラー" }),
          })
        }
        if (url === "/api/me") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ user: mockUser }),
          })
        }
        if (url === "/api/applications/me") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockApplications),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      // 取り消しボタンをクリック
      fireEvent.click(screen.getByTestId("cancel-btn-app-1"))

      // 汎用エラートーストが表示されることを確認
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "エラー",
            variant: "destructive",
          })
        )
      })

      // コンソールスパイを復元
      consoleSpy.mockRestore()
    })
  })

  describe("初期表示", () => {
    it("SSRで渡されたデータが表示される", () => {
      render(
        <ApplicationsClient user={mockUser} initialApplications={mockApplications} />
      )

      // 両方の案件が表示されていることを確認
      expect(screen.getByTestId("job-card-job-1")).toBeInTheDocument()
      expect(screen.getByTestId("job-card-job-2")).toBeInTheDocument()
    })

    it("応募がない場合、空状態が表示される", async () => {
      // 空の応募リストを返すモック
      mockFetch.mockImplementation((url: string) => {
        if (url === "/api/me") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ user: mockUser }),
          })
        }
        if (url === "/api/applications/me") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          })
        }
        if (url === "/api/recommended-jobs") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ items: [] }),
          })
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      })

      render(<ApplicationsClient user={mockUser} initialApplications={[]} />)

      // 空状態のメッセージを確認（非同期で表示される）
      await waitFor(() => {
        expect(
          screen.getByText("現在、応募済みの案件はありません。")
        ).toBeInTheDocument()
      })
    })
  })
})
