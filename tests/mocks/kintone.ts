import { vi } from "vitest"

// Kintone REST API クライアントのモック
export const mockKintoneRecord = {
  getRecord: vi.fn(),
  getRecords: vi.fn(),
  getAllRecords: vi.fn(),
  addRecord: vi.fn(),
  updateRecord: vi.fn(),
  updateRecords: vi.fn(),
  deleteRecords: vi.fn(),
}

export const mockKintoneClient = {
  record: mockKintoneRecord,
}

// モック関数を作成するファクトリ
export const createMockKintoneClient = () => ({
  record: {
    getRecord: vi.fn(),
    getRecords: vi.fn(),
    getAllRecords: vi.fn(),
    addRecord: vi.fn(),
    updateRecord: vi.fn(),
    updateRecords: vi.fn(),
    deleteRecords: vi.fn(),
  },
})

// テストデータ生成ヘルパー
export const createMockTalentRecord = (overrides = {}) => ({
  $id: { value: "1" },
  auth_user_id: { value: "test-user-id" },
  氏名: { value: "テスト太郎" },
  姓: { value: "テスト" },
  名: { value: "太郎" },
  姓_フリガナ: { value: "テスト" },
  名_フリガナ: { value: "タロウ" },
  メールアドレス: { value: "test@example.com" },
  電話番号: { value: "090-1234-5678" },
  生年月日: { value: "1990-01-01" },
  郵便番号: { value: "100-0001" },
  住所: { value: "東京都千代田区" },
  職種: { value: ["エンジニア"] },
  言語_ツール: { value: "React, TypeScript, Node.js" },
  主な実績_PR_職務経歴: { value: "Webアプリケーション開発経験5年" },
  希望稼働時期: { value: "即日" },
  希望単価_月額: { value: "800000" },
  希望稼働日数: { value: "5日/週" },
  出社頻度: { value: "フルリモート" },
  希望勤務スタイル: { value: "業務委託" },
  希望時間: { value: "140-180h" },
  ST: { value: "" },
  ...overrides,
})

export const createMockJobRecord = (overrides = {}) => ({
  $id: { value: "1" },
  案件名: { value: "テスト案件" },
  概要: { value: "テスト案件の概要です" },
  職種_ポジション: { value: ["エンジニア"] },
  スキル: { value: ["React", "TypeScript"] },
  必須スキル: { value: "React経験3年以上" },
  尚可スキル: { value: "TypeScript経験" },
  勤務地エリア: { value: "東京都" },
  最寄駅: { value: "渋谷駅" },
  掲載単価: { value: "800000" },
  リモート可否: { value: "フルリモート" },
  募集ステータス: { value: "募集中" },
  作成日時: { value: new Date().toISOString() },
  ...overrides,
})

export const createMockApplicationRecord = (overrides = {}) => ({
  $id: { value: "1" },
  auth_user_id: { value: "test-user-id" },
  案件ID: { value: "1" },
  案件タイトル: { value: "テスト案件" },
  対応状況: { value: "応募済み" },
  作成日時: { value: new Date().toISOString() },
  ...overrides,
})

export const createMockRecommendationRecord = (overrides = {}) => ({
  $id: { value: "1" },
  人材ID: { value: "test-user-id" },
  案件ID: { value: "1" },
  適合スコア: { value: "5" },
  AIマッチ実行状況: { value: "" },
  担当者おすすめ: { value: "" },
  作成日時: { value: new Date().toISOString() },
  更新日時: { value: new Date().toISOString() },
  ...overrides,
})

// Kintoneクライアントのモックをセットアップ
export const setupKintoneMocks = () => {
  vi.mock("@/lib/kintone/client", () => ({
    createTalentClient: () => createMockKintoneClient(),
    createJobClient: () => createMockKintoneClient(),
    createApplicationClient: () => createMockKintoneClient(),
    createRecommendationClient: () => createMockKintoneClient(),
    createInquiryClient: () => createMockKintoneClient(),
    createAnnouncementClient: () => createMockKintoneClient(),
    getAppIds: () => ({
      talent: "1",
      job: "2",
      application: "3",
      recommendation: "4",
      announcement: "5",
      inquiry: "6",
    }),
  }))
}
