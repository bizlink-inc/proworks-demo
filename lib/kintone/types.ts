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
  希望作業時間: { value: string };
  希望案件_作業内容: { value: string };
  NG企業: { value: string };
  その他要望: { value: string };
  ST?: { value: string }; // ステータス（退会時に「退会」に設定）
  メール配信設定?: { value: string };
  利用規約同意?: { value: string };
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
  募集ステータス?: { value: string }; // ラジオボタン: 募集中, クローズ
  商流?: { value: string }; // ドロップダウン: 商流
  契約形態?: { value: string }; // ドロップダウン: 契約形態
  リモート可否?: { value: string }; // ドロップダウン: リモート可否
  外国籍?: { value: string }; // ドロップダウン: 外国籍
  作成日時: { value: string }; // kintone標準フィールド
  作成日時_開発環境?: { value: string }; // 開発環境用の作成日時
};

// 応募履歴の型定義
export type ApplicationRecord = {
  $id: { value: string };
  auth_user_id: { value: string };
  案件ID: { value: string };
  案件名: { value: string }; // ルックアップで取得
  対応状況: { value: string };
  作成日時: { value: string };
  作成日時_開発環境?: { value: string }; // 開発環境用の作成日時
  面談日?: { value: string }; // 面談日（リマインド通知用）
  面談予定通知日時?: { value: string }; // 面談予定通知を送信した日時
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
  desiredWorkHours: string;
  desiredWork: string;
  ngCompanies: string;
  otherRequests: string;
  st?: string; // ステータス（退会時に「退会」に設定）
  emailDeliveryStatus?: string;
  termsAgreed?: string;
};

export type Job = {
  id: string;
  title: string;
  features: string[]; // 案件特徴（フルリモート可、リモート併用可、常駐案件など）
  position: string[]; // 職種_ポジション
  skills: string[]; // スキル（複数選択）
  description: string;
  environment: string;
  notes: string;
  requiredSkills: string;
  preferredSkills: string;
  location: string; // 勤務地エリア
  nearestStation: string;
  minHours: string;
  maxHours: string;
  period: string;
  rate: string;
  interviewCount: string;
  remote?: string; // リモート可否
  recruitmentStatus?: string; // 募集ステータス: 募集中, クローズ
  isNew?: boolean; // 新着フラグ
  createdAt?: string; // 作成日時
  applicationStatus?: string | null; // ログインユーザーの応募ステータス
  recommendationScore?: number; // おすすめスコア（推薦DBから取得）
  staffRecommend?: boolean; // 担当者おすすめフラグ
  aiMatched?: boolean; // AIマッチフラグ
};

export type Application = {
  id: string;
  authUserId: string;
  jobId: string;
  jobTitle: string; // ルックアップで取得される案件名
  status: string;
  appliedAt: string;
  interviewNotifiedAt?: string; // 面談予定通知を送信した日時
};

// 推薦DBの型定義
export type RecommendationRecord = {
  $id: { value: string };
  人材ID: { value: string };
  案件ID: { value: string };
  適合スコア: { value: string };
  担当者おすすめ?: { value: string };
  AIマッチ実行状況?: { value: string };
  AI総合スコア?: { value: string };
};

export type Recommendation = {
  id: string;
  talentId: string;
  jobId: string;
  score: number;
  staffRecommend?: boolean;
  aiMatched?: boolean;
  aiOverallScore?: number;
};

// システム通知DBの型定義
export type AnnouncementRecord = {
  $id: { value: string };
  掲載種別: { value: string }; // プルダウン: お知らせ, メンテナンス, 障害
  掲載開始日: { value: string }; // 日付フィールド (yyyy-MM-dd形式)
  掲載終了日: { value: string }; // 日付フィールド (yyyy-MM-dd形式)
  通知内容: { value: string };
};

export type Announcement = {
  id: string;
  type: string; // 掲載種別: お知らせ, メンテナンス, 障害
  startDate: string; // 掲載開始日 (yyyy-MM-dd形式)
  endDate: string; // 掲載終了日 (yyyy-MM-dd形式)
  content: string; // 通知内容
};

