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
  DESIRED_WORK_HOURS: '希望作業時間',
  DESIRED_WORK: '希望案件_作業内容',
  NG_COMPANIES: 'NG企業',
  OTHER_REQUESTS: 'その他要望',
  ST: 'ST', // ステータス（退会時に「退会」に更新）
  EMAIL_DELIVERY_STATUS: 'メール配信設定',
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
  RECRUITMENT_STATUS: '募集ステータス', // ラジオボタン: 募集中, クローズ
  BUSINESS_FLOW: '商流', // ドロップダウン: 商流
  CONTRACT_TYPE: '契約形態', // ドロップダウン: 契約形態
  REMOTE: 'リモート可否', // ドロップダウン: リモート可否
  FOREIGN_NATIONALITY: '外国籍', // ドロップダウン: 外国籍
} as const;

// 応募履歴DB（Application）のフィールドコード
export const APPLICATION_FIELDS = {
  ID: '$id',
  AUTH_USER_ID: 'auth_user_id',
  JOB_ID: '案件ID',
  JOB_TITLE: '案件名',
  STATUS: '対応状況',
  CREATED_AT: '作成日時',
  CREATED_AT_DEV: '作成日時_開発環境', // 開発環境用の作成日時
} as const;

// 推薦DB（Recommendation）のフィールドコード
export const RECOMMENDATION_FIELDS = {
  ID: '$id',
  TALENT_ID: '人材ID',
  JOB_ID: '案件ID',
  SCORE: '適合スコア',
  // AI評価フィールド
  // ⚠️ 重要: これらのフィールド定数は、kintoneの推薦DBアプリに実装されています。
  // 修正時は必ずkintone側のフィールド設定を確認してから修正してください。
  // ハードコード（例: '適合スコア'）ではなく、必ずこの定数を参照してください。
  // 定数を参照することで、フィールド名変更時の修正漏れを防げます。
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
  // 担当者おすすめフィールド
  // ⚠️ 重要: このフィールドは営業担当者が手動で設定する「おすすめ」フラグです。
  // AIマッチスコアやプログラムマッチスコアとは別の、担当者の判断による推薦です。
  STAFF_RECOMMEND: '担当者おすすめ',
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

  // 希望作業時間（1日あたり）の選択肢
  DESIRED_WORK_HOURS: ['2時間', '4時間', '6時間', '8時間', '8時間以上', '案件条件に従う'] as const,
} as const;

export type DesiredWorkDays = typeof DROPDOWN_OPTIONS.DESIRED_WORK_DAYS[number];
export type DesiredCommute = typeof DROPDOWN_OPTIONS.DESIRED_COMMUTE[number];
export type DesiredWorkHours = typeof DROPDOWN_OPTIONS.DESIRED_WORK_HOURS[number];

// 問い合わせ・退会DB（Inquiry）のフィールドコード
export const INQUIRY_FIELDS = {
  ID: '$id',
  CATEGORY: '種別',
  RECEIVED_AT: '受付日時',
  USER_ID: 'ユーザーID', // ルックアップキー（人材DBのauth_user_id）
  USER_NAME: '氏名', // ルックアップで自動取得
  STATUS: '対応ステータス',
  ASSIGNEE: '対応者',
  INTERNAL_MEMO: '対応メモ',
  // 問い合わせ用
  INQUIRY_CATEGORY: '問い合わせカテゴリ',
  INQUIRY_CONTENT: '問い合わせ内容',
  REPLY_CONTENT: '返信内容',
  // 退会用
  WITHDRAWAL_REASON: '退会理由',
  WITHDRAWAL_REASON_DETAIL: '退会理由詳細',
  CONFIRMATION_AGREED: '確認事項同意',
} as const;

export const INQUIRY_FIELDS_BY_VALUE = createFieldsByValue(INQUIRY_FIELDS);
