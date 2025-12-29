import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// モックデータ
const mockSession = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
  },
}

const mockTalent = {
  id: "1",
  authUserId: "test-user-id",
  fullName: "テスト太郎",
  lastName: "テスト",
  firstName: "太郎",
  email: "test@example.com",
  phone: "090-1234-5678",
  birthDate: "1990-01-01",
  st: "",
}

const mockWithdrawnTalent = {
  ...mockTalent,
  st: "退会",
}

const mockIncompleteTalent = {
  ...mockTalent,
  lastNameKana: "",
  firstNameKana: "",
  zipCode: "",
  address: "",
}

const mockCompleteTalent = {
  ...mockTalent,
  lastNameKana: "テスト",
  firstNameKana: "タロウ",
  zipCode: "100-0001",
  address: "東京都千代田区",
  skills: "React, TypeScript",
  career: "経験豊富",
  resumeFile: "resume.pdf",
  availableDate: "即日",
  desiredRate: "800000",
  desiredWorkDays: "5日/週",
  workFrequency: "フルリモート",
  workStyle: "業務委託",
  desiredHours: "140-180h",
}

// モックを定義
vi.mock("@/lib/auth-server", () => ({
  getSession: vi.fn(() => mockSession),
}))

vi.mock("@/lib/kintone/services/talent", () => ({
  getTalentByAuthUserId: vi.fn(),
  updateTalent: vi.fn(),
}))

vi.mock("@/lib/utils/profile-validation", () => ({
  checkRequiredFields: vi.fn(() => []),
}))

vi.mock("@/lib/slack", () => ({
  sendProfileCompleteNotification: vi.fn().mockResolvedValue(undefined),
}))

// テスト対象をインポート
import { GET, PATCH } from "@/app/api/me/route"
import { getSession } from "@/lib/auth-server"
import { getTalentByAuthUserId, updateTalent } from "@/lib/kintone/services/talent"
import { checkRequiredFields } from "@/lib/utils/profile-validation"
import { sendProfileCompleteNotification } from "@/lib/slack"

describe("GET /api/me", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(getTalentByAuthUserId).mockResolvedValue(mockTalent as any)
  })

  describe("2.1.1 プロフィール取得", () => {
    it("ログイン済みユーザーのプロフィールが取得できる", async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.fullName).toBe("テスト太郎")
      expect(data.email).toBe("test@example.com")
    })
  })

  describe("2.1.2 退会済みユーザー", () => {
    it("退会済みユーザーがアクセスすると403エラーが返される", async () => {
      vi.mocked(getTalentByAuthUserId).mockResolvedValueOnce(mockWithdrawnTalent as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe("このアカウントは退会済みです")
      expect(data.withdrawn).toBe(true)
    })
  })

  describe("認証チェック", () => {
    it("未認証の場合、401エラーが返される", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })

  describe("人材レコードが存在しない場合", () => {
    it("人材レコードが見つからない場合、404エラーが返される", async () => {
      vi.mocked(getTalentByAuthUserId).mockResolvedValueOnce(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Talent not found")
    })
  })
})

describe("PATCH /api/me", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSession).mockResolvedValue(mockSession)
    vi.mocked(getTalentByAuthUserId).mockResolvedValue(mockTalent as any)
    vi.mocked(updateTalent).mockResolvedValue(undefined)
    vi.mocked(checkRequiredFields).mockReturnValue([])
  })

  describe("2.2.1 基本情報の更新", () => {
    it("プロフィール情報を更新できる", async () => {
      const request = new NextRequest("http://localhost:3000/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          lastName: "更新",
          firstName: "太郎",
          phone: "090-9999-8888",
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.lastName).toBe("更新")
      expect(data.phone).toBe("090-9999-8888")

      // updateTalentが呼ばれたことを確認
      expect(updateTalent).toHaveBeenCalledWith("1", {
        lastName: "更新",
        firstName: "太郎",
        phone: "090-9999-8888",
      })
    })
  })

  describe("2.2.2 スキル情報の更新", () => {
    it("スキル情報を更新できる", async () => {
      const request = new NextRequest("http://localhost:3000/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          skills: "React, TypeScript, Node.js, AWS",
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.skills).toBe("React, TypeScript, Node.js, AWS")
    })
  })

  describe("2.2.3 希望条件の更新", () => {
    it("希望条件を更新できる", async () => {
      const request = new NextRequest("http://localhost:3000/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          desiredRate: "900000",
          availableDate: "来月",
          workFrequency: "リモート併用",
        }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.desiredRate).toBe("900000")
      expect(data.availableDate).toBe("来月")
    })
  })

  describe("2.2.5 プロフィール完成時のSlack通知", () => {
    it("プロフィールが未完了から完了になった場合、Slack通知が送信される", async () => {
      // 更新前は未完了
      vi.mocked(checkRequiredFields)
        .mockReturnValueOnce(["lastNameKana", "firstNameKana"]) // 更新前
        .mockReturnValueOnce([]) // 更新後

      const request = new NextRequest("http://localhost:3000/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          lastNameKana: "テスト",
          firstNameKana: "タロウ",
        }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(200)
      expect(sendProfileCompleteNotification).toHaveBeenCalledTimes(1)
      expect(sendProfileCompleteNotification).toHaveBeenCalledWith({
        fullName: "テスト 太郎",
        email: "test@example.com",
        talentRecordId: "1",
      })
    })
  })

  describe("2.2.6 すでにプロフィール完成済みの場合", () => {
    it("プロフィールが既に完成している場合、Slack通知は送信されない", async () => {
      // 更新前も更新後も完了
      vi.mocked(checkRequiredFields)
        .mockReturnValueOnce([]) // 更新前
        .mockReturnValueOnce([]) // 更新後

      const request = new NextRequest("http://localhost:3000/api/me", {
        method: "PATCH",
        body: JSON.stringify({
          phone: "090-1111-2222",
        }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(200)
      expect(sendProfileCompleteNotification).not.toHaveBeenCalled()
    })
  })

  describe("認証チェック", () => {
    it("未認証の場合、401エラーが返される", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const request = new NextRequest("http://localhost:3000/api/me", {
        method: "PATCH",
        body: JSON.stringify({ lastName: "更新" }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe("Unauthorized")
    })
  })

  describe("人材レコードが存在しない場合", () => {
    it("人材レコードが見つからない場合、404エラーが返される", async () => {
      vi.mocked(getTalentByAuthUserId).mockResolvedValueOnce(null)

      const request = new NextRequest("http://localhost:3000/api/me", {
        method: "PATCH",
        body: JSON.stringify({ lastName: "更新" }),
      })

      const response = await PATCH(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe("Talent not found")
    })
  })
})
