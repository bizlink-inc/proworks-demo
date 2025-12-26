/**
 * Kintone モック
 * Kintone API クライアントとレコードファクトリ
 */

import type { Job, Application, Talent, JobRecord, ApplicationRecord, TalentRecord } from "@/lib/kintone/types";

// ============================================
// テストデータファクトリ（フロントエンド用の型）
// ============================================

/**
 * テスト用案件データを作成
 */
export const createMockJob = (overrides: Partial<Job> = {}): Job => ({
  id: "job-1",
  title: "React開発者募集",
  features: ["フルリモート可"],
  position: ["PM (プロジェクトマネージャー)"],
  skills: ["TypeScript", "React", "Node.js"],
  description: "Webアプリケーションの開発案件です。",
  environment: "React, TypeScript, AWS",
  notes: "",
  requiredSkills: "TypeScript 3年以上、React 2年以上",
  preferredSkills: "Next.js、AWS経験",
  location: "東京都",
  nearestStation: "渋谷駅",
  minHours: "140",
  maxHours: "180",
  period: "長期",
  rate: "80万円",
  interviewCount: "2回",
  remote: "フルリモート可",
  recruitmentStatus: "募集中",
  isNew: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * テスト用応募データを作成
 */
export const createMockApplication = (overrides: Partial<Application> = {}): Application => ({
  id: "app-1",
  authUserId: "test-user-123",
  jobId: "job-1",
  jobTitle: "React開発者募集",
  status: "応募済み",
  appliedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * テスト用人材データを作成
 */
export const createMockTalent = (overrides: Partial<Talent> = {}): Talent => ({
  id: "talent-1",
  authUserId: "test-user-123",
  lastName: "テスト",
  firstName: "太郎",
  fullName: "テスト 太郎",
  lastNameKana: "テスト",
  firstNameKana: "タロウ",
  email: "test@example.com",
  birthDate: "1990-01-01",
  postalCode: "150-0001",
  address: "東京都渋谷区神宮前1-1-1",
  phone: "090-1234-5678",
  skills: "TypeScript, React, Node.js",
  experience: "Webアプリケーション開発5年",
  resumeFiles: [],
  portfolioUrl: "",
  availableFrom: "即日",
  desiredRate: "80万円",
  desiredWorkDays: "週5日",
  desiredCommute: "リモート希望",
  desiredWorkStyle: ["フルリモート"],
  desiredWorkHours: "140-180h",
  desiredWork: "バックエンド開発",
  ngCompanies: "",
  otherRequests: "",
  ...overrides,
});

// ============================================
// Kintone レコード形式のファクトリ
// ============================================

/**
 * Kintone形式の案件レコードを作成
 */
export const createMockJobRecord = (overrides: Partial<Record<string, { value: unknown }>> = {}): JobRecord => ({
  $id: { value: "job-1" },
  案件名: { value: "React開発者募集" },
  案件特徴: { value: ["フルリモート可"] },
  職種_ポジション: { value: ["PM (プロジェクトマネージャー)"] },
  スキル: { value: ["TypeScript", "React", "Node.js"] },
  概要: { value: "Webアプリケーションの開発案件です。" },
  環境: { value: "React, TypeScript, AWS" },
  備考: { value: "" },
  必須スキル: { value: "TypeScript 3年以上、React 2年以上" },
  尚可スキル: { value: "Next.js、AWS経験" },
  勤務地エリア: { value: "東京都" },
  最寄駅: { value: "渋谷駅" },
  下限h: { value: "140" },
  上限h: { value: "180" },
  案件期間: { value: "長期" },
  掲載単価: { value: "80万円" },
  面談回数: { value: "2回" },
  募集ステータス: { value: "募集中" },
  リモート可否: { value: "フルリモート可" },
  作成日時: { value: new Date().toISOString() },
  ...overrides,
} as JobRecord);

/**
 * Kintone形式の応募レコードを作成
 */
export const createMockApplicationRecord = (overrides: Partial<Record<string, { value: unknown }>> = {}): ApplicationRecord => ({
  $id: { value: "app-1" },
  auth_user_id: { value: "test-user-123" },
  案件ID: { value: "job-1" },
  案件名: { value: "React開発者募集" },
  対応状況: { value: "応募済み" },
  作成日時: { value: new Date().toISOString() },
  ...overrides,
} as ApplicationRecord);

/**
 * Kintone形式の人材レコードを作成
 */
export const createMockTalentRecord = (overrides: Partial<Record<string, { value: unknown }>> = {}): TalentRecord => ({
  $id: { value: "talent-1" },
  auth_user_id: { value: "test-user-123" },
  姓: { value: "テスト" },
  名: { value: "太郎" },
  氏名: { value: "テスト 太郎" },
  セイ: { value: "テスト" },
  メイ: { value: "タロウ" },
  メールアドレス: { value: "test@example.com" },
  生年月日: { value: "1990-01-01" },
  郵便番号: { value: "150-0001" },
  住所: { value: "東京都渋谷区神宮前1-1-1" },
  電話番号: { value: "090-1234-5678" },
  言語_ツール: { value: "TypeScript, React, Node.js" },
  主な実績_PR_職務経歴: { value: "Webアプリケーション開発5年" },
  職務経歴書データ: { value: [] },
  ポートフォリオリンク: { value: "" },
  稼働可能時期: { value: "即日" },
  希望単価_月額: { value: "80万円" },
  希望勤務日数: { value: "週5日" },
  希望出社頻度: { value: "リモート希望" },
  希望勤務スタイル: { value: ["フルリモート"] },
  希望作業時間: { value: "140-180h" },
  希望案件_作業内容: { value: "バックエンド開発" },
  NG企業: { value: "" },
  その他要望: { value: "" },
  ...overrides,
} as TalentRecord);

// ============================================
// サービス関数のモック
// ============================================

// Job Service
export const mockGetJobById = jest.fn();
export const mockGetAllJobs = jest.fn();

// Application Service
export const mockCreateApplication = jest.fn();
export const mockCheckDuplicateApplication = jest.fn();
export const mockGetApplicationsByAuthUserId = jest.fn();
export const mockUpdateApplicationStatus = jest.fn();
export const mockGetApplicationById = jest.fn();

// Talent Service
export const mockGetTalentByAuthUserId = jest.fn();
export const mockCreateTalent = jest.fn();
export const mockUpdateTalent = jest.fn();

// Email Service
export const mockSendApplicationCompleteEmail = jest.fn();
export const mockSendApplicationCancelEmail = jest.fn();

/**
 * すべてのKintoneモックをリセット
 */
export const resetKintoneMocks = () => {
  // Job
  mockGetJobById.mockReset();
  mockGetAllJobs.mockReset();

  // Application
  mockCreateApplication.mockReset();
  mockCheckDuplicateApplication.mockReset();
  mockGetApplicationsByAuthUserId.mockReset();
  mockUpdateApplicationStatus.mockReset();
  mockGetApplicationById.mockReset();

  // Talent
  mockGetTalentByAuthUserId.mockReset();
  mockCreateTalent.mockReset();
  mockUpdateTalent.mockReset();

  // Email
  mockSendApplicationCompleteEmail.mockReset();
  mockSendApplicationCancelEmail.mockReset();
};

/**
 * デフォルトの正常系モックを設定
 */
export const setupDefaultMocks = () => {
  resetKintoneMocks();

  // Job - デフォルトで1件の案件を返す
  mockGetJobById.mockResolvedValue(createMockJob());
  mockGetAllJobs.mockResolvedValue([createMockJob()]);

  // Application - デフォルトで重複なし、作成成功
  mockCheckDuplicateApplication.mockResolvedValue(false);
  mockCreateApplication.mockResolvedValue("app-new-1");
  mockGetApplicationsByAuthUserId.mockResolvedValue([]);
  mockUpdateApplicationStatus.mockResolvedValue(undefined);
  mockGetApplicationById.mockResolvedValue(createMockApplication());

  // Talent - デフォルトで人材データを返す
  mockGetTalentByAuthUserId.mockResolvedValue(createMockTalent());

  // Email - デフォルトで成功
  mockSendApplicationCompleteEmail.mockResolvedValue({ success: true });
  mockSendApplicationCancelEmail.mockResolvedValue({ success: true });
};
