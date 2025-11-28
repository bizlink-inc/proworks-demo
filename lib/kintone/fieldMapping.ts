/**
 * kintone フィールドコード管理
 * すべてのフィールドコードを一箇所で管理することで、
 * フィールド名変更時の修正を最小化します
 */

// 人材DB（Talent）のフィールドコード
export const TALENT_FIELDS = {
  ID: '$id',
  AUTH_USER_ID: 'auth_user_id',
  LAST_NAME: '姓',
  FIRST_NAME: '名',
  FULL_NAME: '氏名',
  LAST_NAME_KANA: 'セイ',
  FIRST_NAME_KANA: 'メイ',
  EMAIL: 'メールアドレス',
  BIRTH_DATE: '生年月日',
  POSTAL_CODE: '郵便番号',
  ADDRESS: '住所',
  PHONE: '電話番号',
  SKILLS: '言語_ツール',
  EXPERIENCE: '主な実績_PR_職務経歴',
  RESUME_FILES: '職務経歴書データ',
  PORTFOLIO_URL: 'ポートフォリオリンク',
  AVAILABLE_FROM: '稼働可能時期',
  DESIRED_RATE: '希望単価_月額',
  DESIRED_WORK_DAYS: '希望勤務日数',
  DESIRED_COMMUTE: '希望出社頻度',
  DESIRED_WORK_STYLE: '希望勤務スタイル',
  DESIRED_WORK: '希望案件_作業内容',
  NG_COMPANIES: 'NG企業',
  OTHER_REQUESTS: 'その他要望',
  // 新規登録時の同意・設定フィールド
  EMAIL_DELIVERY_STATUS: 'メール配信ステータス',
  TERMS_AGREED: '利用規約同意',
} as const;

// 案件DB（Job）のフィールドコード
export const JOB_FIELDS = {
  ID: '$id',
  JOB_ID: '案件ID', // ルックアップ参照用のキーフィールド
  TITLE: '案件名',
  FEATURES: '案件特徴',
  POSITION: '職種_ポジション',
  SKILLS: 'スキル',
  DESCRIPTION: '概要',
  ENVIRONMENT: '環境',
  NOTES: '備考',
  REQUIRED_SKILLS: '必須スキル',
  PREFERRED_SKILLS: '尚可スキル',
  LOCATION: '勤務地エリア',
  NEAREST_STATION: '最寄駅',
  MIN_HOURS: '下限h',
  MAX_HOURS: '上限h',
  PERIOD: '案件期間',
  RATE: '掲載単価',
  INTERVIEW_COUNT: '面談回数',
  REMOTE: 'ドロップダウン_3', // リモート可否（可/不可/条件付き可）
  NEW_FLAG: '新着フラグ', // 新着案件フラグ
} as const;

// 応募履歴DB（Application）のフィールドコード
export const APPLICATION_FIELDS = {
  ID: '$id',
  AUTH_USER_ID: 'auth_user_id',
  JOB_ID: '案件ID',
  JOB_TITLE: '案件名',
  STATUS: '対応状況',
  CREATED_AT: '作成日時',
} as const;

// 推薦DB（Recommendation）のフィールドコード
export const RECOMMENDATION_FIELDS = {
  ID: '$id',
  TALENT_ID: '人材ID',
  JOB_ID: '案件ID',
  SCORE: '適合スコア',
  // AI評価フィールド
  AI_EXECUTION_STATUS: 'AIマッチ実行状況',
  AI_SKILL_SCORE: 'AI技術スキルスコア',
  AI_PROCESS_SCORE: 'AI開発工程スコア',
  AI_INFRA_SCORE: 'AIインフラスコア',
  AI_DOMAIN_SCORE: 'AI業務知識スコア',
  AI_TEAM_SCORE: 'AIチーム開発スコア',
  AI_TOOL_SCORE: 'AIツール環境スコア',
  AI_OVERALL_SCORE: 'AI総合スコア',
  AI_RESULT: 'AI評価結果',
  AI_EXECUTED_AT: 'AI実行日時',
} as const;

/**
 * フィールドコードの逆マッピング用ユーティリティ
 * （キーから値を探すときに使用）
 */
export const createFieldsByValue = <T extends Record<string, string>>(fields: T) => {
  const result: Record<string, keyof T> = {};
  Object.entries(fields).forEach(([key, value]) => {
    result[value] = key as keyof T;
  });
  return result as Readonly<Record<string, keyof T>>;
};

export const TALENT_FIELDS_BY_VALUE = createFieldsByValue(TALENT_FIELDS);
export const JOB_FIELDS_BY_VALUE = createFieldsByValue(JOB_FIELDS);
export const APPLICATION_FIELDS_BY_VALUE = createFieldsByValue(APPLICATION_FIELDS);
export const RECOMMENDATION_FIELDS_BY_VALUE = createFieldsByValue(RECOMMENDATION_FIELDS);

/**
 * ドロップダウンフィールドの選択肢
 */
export const DROPDOWN_OPTIONS = {
  // 希望勤務日数の選択肢
  DESIRED_WORK_DAYS: ['週1', '週2', '週3', '週4', '週5', '案件条件に従う'] as const,
  
  // 希望出社頻度の選択肢
  DESIRED_COMMUTE: ['週1', '週2', '週3', '週4', '週5', '案件条件に従う', 'なし'] as const,
  
  // メール配信ステータスの選択肢
  EMAIL_DELIVERY_STATUS: ['配信中', '配信停止'] as const,
  
  // 利用規約同意の選択肢
  TERMS_AGREED: ['同意済み'] as const,
  
  // リモート可否の選択肢
  REMOTE: ['可', '不可', '条件付き可'] as const,
  
  // 新着フラグの選択肢
  NEW_FLAG: ['新着案件', ''] as const,
} as const;

export type DesiredWorkDays = typeof DROPDOWN_OPTIONS.DESIRED_WORK_DAYS[number];
export type DesiredCommute = typeof DROPDOWN_OPTIONS.DESIRED_COMMUTE[number];
export type EmailDeliveryStatus = typeof DROPDOWN_OPTIONS.EMAIL_DELIVERY_STATUS[number];
export type TermsAgreed = typeof DROPDOWN_OPTIONS.TERMS_AGREED[number];
export type Remote = typeof DROPDOWN_OPTIONS.REMOTE[number];
