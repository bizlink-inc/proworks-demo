// 人材DBの型定義
export type TalentRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  姓: { value: string };
  名: { value: string };
  氏名: { value: string };
  セイ: { value: string };
  メイ: { value: string };
  メールアドレス: { value: string };
  生年月日: { value: string };
  郵便番号: { value: string };
  住所: { value: string };
  電話番号: { value: string };
  言語_ツール: { value: string };
  主な実績_PR_職務経歴: { value: string };
  職務経歴書データ: { value: Array<{ fileKey: string; name: string; size: string }> };
  ポートフォリオリンク: { value: string };
  稼働可能時期: { value: string };
  希望単価_月額: { value: string };
  希望勤務日数: { value: string };
  希望出社頻度: { value: string };
  希望勤務スタイル: { value: string[] }; // チェックボックス
  希望案件_作業内容: { value: string };
  NG企業: { value: string };
  その他要望: { value: string };
  // 新規登録時の同意・設定フィールド
  メール配信ステータス: { value: string };
  利用規約同意: { value: string };
};

// 案件DBの型定義
export type JobRecord = {
  $id: { value: string };
  案件名: { value: string };
  案件特徴: { value: string[] }; // 複数選択
  職種_ポジション: { value: string[] }; // 複数選択
  スキル: { value: string[] }; // 複数選択
  概要: { value: string };
  環境: { value: string };
  備考: { value: string };
  必須スキル: { value: string };
  尚可スキル: { value: string };
  勤務地エリア: { value: string };
  最寄駅: { value: string };
  下限h: { value: string };
  上限h: { value: string };
  案件期間: { value: string };
  掲載単価: { value: string };
  面談回数: { value: string };
  ドロップダウン_3?: { value: string }; // リモート可否（可/不可/条件付き可）
  新着フラグ?: { value: string }; // 新着案件フラグ
};

// 応募履歴の型定義
export type ApplicationRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  案件ID: { value: string };
  案件名: { value: string }; // ルックアップで取得
  対応状況: { value: string };
  作成日時: { value: string };
};

// フロントエンド用の型定義（valueを展開した形）
export type Talent = {
  id: string;
  authUserId: string;
  lastName: string;
  firstName: string;
  fullName: string;
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  birthDate: string;
  postalCode: string;
  address: string;
  phone: string;
  skills: string;
  experience: string;
  resumeFiles: Array<{ fileKey: string; name: string; size: number; contentType: string }>;
  portfolioUrl: string;
  availableFrom: string;
  desiredRate: string;
  desiredWorkDays: string;
  desiredCommute: string;
  desiredWorkStyle: string[];
  desiredWork: string;
  ngCompanies: string;
  otherRequests: string;
  // 新規登録時の同意・設定フィールド
  emailDeliveryStatus: string;
  termsAgreed: string;
};

export type Job = {
  id: string;
  title: string;
  features: string[];
  position: string[];
  skills: string[]; // スキル（複数選択）
  description: string;
  environment: string;
  notes: string;
  requiredSkills: string;
  preferredSkills: string;
  location: string;
  nearestStation: string;
  minHours: string;
  maxHours: string;
  period: string;
  rate: string;
  interviewCount: string;
  remote: string; // リモート可否（可/不可/条件付き可）
  isNew: boolean; // 新着案件フラグ
  applicationStatus?: string | null; // ログインユーザーの応募ステータス
};

export type Application = {
  id: string;
  authUserId: string;
  jobId: string;
  jobTitle: string; // ルックアップで取得される案件名
  status: string;
  appliedAt: string;
};

// 推薦DBの型定義
export type RecommendationRecord = {
  $id: { value: string };
  人材ID: { value: string };
  案件ID: { value: string };
  適合スコア: { value: string };
  // AI評価フィールド
  AIマッチ実行状況?: { value: string }; // "未実行" | "実行済み" | "スキップ"
  AI技術スキルスコア?: { value: string };
  AI開発工程スコア?: { value: string };
  AIインフラスコア?: { value: string };
  AI業務知識スコア?: { value: string };
  AIチーム開発スコア?: { value: string };
  AIツール環境スコア?: { value: string };
  AI総合スコア?: { value: string };
  AI評価結果?: { value: string };
  AI実行日時?: { value: string };
};

export type Recommendation = {
  id: string;
  talentId: string;
  jobId: string;
  score: number;
  // AI評価
  aiExecutionStatus?: string;
  aiSkillScore?: number;
  aiProcessScore?: number;
  aiInfraScore?: number;
  aiDomainScore?: number;
  aiTeamScore?: number;
  aiToolScore?: number;
  aiOverallScore?: number;
  aiResult?: string;
  aiExecutedAt?: string;
};

