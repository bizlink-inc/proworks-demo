/**
 * 適合度テスト用シードデータ（5人×5案件）
 * セット2: 各人材が特定の案件に最も適合するよう設計
 */
export const seedData2 = {
  // Better Auth ユーザー (5人)
  authUsers: [
    {
      id: "seed_user_001",
      name: "田中 一郎",
      email: "seed_tanaka@example.com",
      password: "password123",
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "seed_user_002",
      name: "佐藤 次郎",
      email: "seed_sato@example.com",
      password: "password123",
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "seed_user_003",
      name: "鈴木 三郎",
      email: "seed_suzuki@example.com",
      password: "password123",
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "seed_user_004",
      name: "高橋 四郎",
      email: "seed_takahashi@example.com",
      password: "password123",
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "seed_user_005",
      name: "伊藤 五郎",
      email: "seed_ito@example.com",
      password: "password123",
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  // 人材DB (5人) - 各人材は特定の案件に最も適合するよう設計
  talents: [
    // 人材1: フロントエンド特化 → 案件1（フロントエンド開発案件）に最も適合
    {
      auth_user_id: "seed_user_001",
      姓: "田中",
      名: "一郎",
      氏名: "田中 一郎",
      セイ: "タナカ",
      メイ: "イチロウ",
      メールアドレス: "seed_tanaka@example.com",
      電話番号: "090-1111-1111",
      生年月日: "1992-03-15",
      郵便番号: "150-0001",
      住所: "東京都渋谷区神宮前1-1-1",
      言語_ツール: "JavaScript, TypeScript, React, Vue.js, Next.js, HTML, CSS, Sass, TailwindCSS",
      主な実績_PR_職務経歴: `【経歴概要】
フロントエンドエンジニアとして6年の実務経験があります。
React/Next.jsを中心としたモダンなフロントエンド開発が得意です。

【主なプロジェクト】
・大手ECサイトのフロントエンドリニューアル（React + TypeScript）
・管理画面のSPA化プロジェクト（Vue.js）
・デザインシステムの構築と運用（Storybook）

【アピールポイント】
・UIコンポーネント設計に精通
・パフォーマンスチューニングの経験豊富
・アクセシビリティ対応の知見あり`,
      ポートフォリオリンク: "https://github.com/tanaka-ichiro",
      稼働可能時期: "2025-12-01",
      希望単価_月額: 70,
      希望勤務日数: "週5",
      希望出社頻度: "週2",
      希望勤務スタイル: ["ハイブリッド", "リモート"],
      希望案件_作業内容: `・React/Next.jsを使ったフロントエンド開発
・TypeScriptでの型安全な開発
・UIコンポーネントの設計・実装
・デザインシステムの構築`,
      NG企業: "特になし",
      その他要望: "リモート中心で、フレックスタイム制の案件を希望します。",
    },
    // 人材2: バックエンド特化 → 案件2（バックエンド開発案件）に最も適合
    {
      auth_user_id: "seed_user_002",
      姓: "佐藤",
      名: "次郎",
      氏名: "佐藤 次郎",
      セイ: "サトウ",
      メイ: "ジロウ",
      メールアドレス: "seed_sato@example.com",
      電話番号: "090-2222-2222",
      生年月日: "1988-07-20",
      郵便番号: "100-0001",
      住所: "東京都千代田区丸の内1-1-1",
      言語_ツール: "Python, Django, FastAPI, PostgreSQL, MySQL, Docker, Redis, Celery",
      主な実績_PR_職務経歴: `【経歴概要】
バックエンドエンジニアとして8年の実務経験があります。
Python/Djangoを中心としたWebアプリケーション開発が得意です。

【主なプロジェクト】
・金融系システムのAPI開発（Django REST Framework）
・大規模データ処理基盤の構築（Python + PostgreSQL）
・マイクロサービスアーキテクチャへの移行プロジェクト

【アピールポイント】
・大規模システムの設計・開発経験
・データベース設計・チューニングに精通
・セキュリティ要件の厳しいシステム開発経験`,
      ポートフォリオリンク: "https://github.com/sato-jiro",
      稼働可能時期: "2026-01-01",
      希望単価_月額: 80,
      希望勤務日数: "週5",
      希望出社頻度: "週3",
      希望勤務スタイル: ["ハイブリッド"],
      希望案件_作業内容: `・PythonでのバックエンドAPI開発
・Djangoを使ったWebアプリケーション開発
・データベース設計・最適化
・PostgreSQLのチューニング`,
      NG企業: "特になし",
      その他要望: "技術的なチャレンジができる環境を希望します。",
    },
    // 人材3: フルスタック → 案件3（フルスタック開発案件）に最も適合
    {
      auth_user_id: "seed_user_003",
      姓: "鈴木",
      名: "三郎",
      氏名: "鈴木 三郎",
      セイ: "スズキ",
      メイ: "サブロウ",
      メールアドレス: "seed_suzuki@example.com",
      電話番号: "090-3333-3333",
      生年月日: "1990-11-10",
      郵便番号: "106-0001",
      住所: "東京都港区六本木1-1-1",
      言語_ツール: "JavaScript, TypeScript, Node.js, React, Next.js, AWS, Docker, GraphQL, MongoDB",
      主な実績_PR_職務経歴: `【経歴概要】
フルスタックエンジニアとして7年の実務経験があります。
フロントエンドからバックエンド、インフラまで幅広く対応可能です。

【主なプロジェクト】
・スタートアップでの新規サービス立ち上げ（Next.js + Node.js + AWS）
・ECプラットフォームのフルスタック開発
・サーバーレスアーキテクチャへの移行

【アピールポイント】
・0→1のサービス立ち上げ経験豊富
・AWSを使ったインフラ構築・運用経験
・技術選定からデプロイまで一貫して対応可能`,
      ポートフォリオリンク: "https://github.com/suzuki-saburo",
      稼働可能時期: "2025-12-15",
      希望単価_月額: 75,
      希望勤務日数: "週5",
      希望出社頻度: "週1",
      希望勤務スタイル: ["リモート", "ハイブリッド"],
      希望案件_作業内容: `・Node.js/Next.jsでのフルスタック開発
・AWSを使ったインフラ構築
・新規サービスの技術選定・設計
・GraphQL APIの設計・実装`,
      NG企業: "特になし",
      その他要望: "フルリモートで働ける環境を希望します。",
    },
    // 人材4: モバイル特化 → 案件4（モバイルアプリ開発案件）に最も適合
    {
      auth_user_id: "seed_user_004",
      姓: "高橋",
      名: "四郎",
      氏名: "高橋 四郎",
      セイ: "タカハシ",
      メイ: "シロウ",
      メールアドレス: "seed_takahashi@example.com",
      電話番号: "090-4444-4444",
      生年月日: "1993-05-25",
      郵便番号: "160-0001",
      住所: "東京都新宿区西新宿1-1-1",
      言語_ツール: "React Native, TypeScript, Firebase, Swift, Kotlin, Expo, Redux",
      主な実績_PR_職務経歴: `【経歴概要】
モバイルアプリエンジニアとして5年の実務経験があります。
React Nativeを中心としたクロスプラットフォーム開発が得意です。

【主なプロジェクト】
・フィンテック系アプリの開発（React Native + Firebase）
・ヘルスケアアプリの新規開発（iOS/Android両対応）
・既存ネイティブアプリのReact Native移行

【アピールポイント】
・iOS/Android両方のストア申請経験
・Firebaseを使ったバックエンド構築
・アプリのパフォーマンス最適化`,
      ポートフォリオリンク: "https://github.com/takahashi-shiro",
      稼働可能時期: "2026-01-15",
      希望単価_月額: 72,
      希望勤務日数: "週4",
      希望出社頻度: "週1",
      希望勤務スタイル: ["リモート", "ハイブリッド"],
      希望案件_作業内容: `・React Nativeでのモバイルアプリ開発
・TypeScriptでの型安全な開発
・Firebaseを使ったバックエンド構築
・アプリのリリース・運用`,
      NG企業: "特になし",
      その他要望: "週4日勤務での参画を希望します。",
    },
    // 人材5: データエンジニア → 案件5（データエンジニアリング案件）に最も適合
    {
      auth_user_id: "seed_user_005",
      姓: "伊藤",
      名: "五郎",
      氏名: "伊藤 五郎",
      セイ: "イトウ",
      メイ: "ゴロウ",
      メールアドレス: "seed_ito@example.com",
      電話番号: "090-5555-5555",
      生年月日: "1987-09-05",
      郵便番号: "140-0001",
      住所: "東京都品川区北品川1-1-1",
      言語_ツール: "Python, SQL, AWS, BigQuery, Apache Spark, Apache Airflow, Terraform, dbt",
      主な実績_PR_職務経歴: `【経歴概要】
データエンジニアとして9年の実務経験があります。
大規模データ基盤の構築・運用が得意です。

【主なプロジェクト】
・データレイク/データウェアハウスの設計・構築（AWS + BigQuery）
・ETLパイプラインの自動化（Apache Airflow）
・リアルタイムデータ処理基盤の構築（Apache Spark）

【アピールポイント】
・ペタバイト級のデータ処理経験
・データ品質管理・ガバナンスの知見
・機械学習エンジニアとの協業経験`,
      ポートフォリオリンク: "https://github.com/ito-goro",
      稼働可能時期: "2026-02-01",
      希望単価_月額: 85,
      希望勤務日数: "週5",
      希望出社頻度: "週2",
      希望勤務スタイル: ["ハイブリッド"],
      希望案件_作業内容: `・Pythonでのデータパイプライン構築
・SQLを使ったデータ分析・加工
・AWSを使ったデータ基盤構築
・BigQueryでのデータウェアハウス設計`,
      NG企業: "特になし",
      その他要望: "データ基盤の設計から携わりたいです。",
    },
  ],

  // 案件DB (5件) - スキルフィールドを追加
  jobs: [
    // 案件1: フロントエンド開発案件 → 人材1が最も適合
    {
      案件名: "大手ECサイトのフロントエンド刷新案件",
      ルックアップ: "株式会社サンプル商事",
      職種_ポジション: ["フロントエンドエンジニア"],
      スキル: ["JavaScript", "React", "TypeScript"],
      概要: `大手ECサイトのフロントエンド刷新プロジェクトです。
既存のjQueryベースのシステムをReact + Next.jsでモダンなSPAに刷新します。
チーム開発の経験があり、モダンなフロントエンド技術に精通している方を募集しています。`,
      環境: `【開発環境】
・フロントエンド: React 18, Next.js 14, TypeScript
・バックエンド: Node.js, Express
・インフラ: AWS (EC2, S3, CloudFront)
・その他: Docker, GitHub Actions`,
      必須スキル: `・React/Next.jsを使った開発経験 2年以上
・TypeScriptの実務経験
・Git/GitHubを使ったチーム開発経験
・レスポンシブデザインの実装経験`,
      尚可スキル: `・パフォーマンスチューニングの経験
・テスト自動化（Jest, Testing Library）
・Storybookを使ったコンポーネント開発
・アクセシビリティ対応の経験`,
      勤務地エリア: "東京都渋谷区",
      最寄駅: "渋谷駅",
      下限h: 140,
      上限h: 180,
      掲載単価: 75,
      MAX単価: 80,
      案件期間: "6ヶ月〜長期",
      参画時期: "2025-12-01",
      面談回数: "2回",
      案件特徴: ["大手直案件", "長期案件", "リモート併用可", "上流工程参画", "最新技術導入"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "直",
      契約形態: "準委任",
      リモート可否: "可",
      外国籍: "可",
      募集人数: 2,
      新着フラグ: "新着案件",
    },
    // 案件2: バックエンド開発案件 → 人材2が最も適合
    {
      案件名: "金融系WebアプリケーションAPI開発",
      ルックアップ: "○○銀行",
      職種_ポジション: ["バックエンドエンジニア"],
      スキル: ["Python", "Django", "PostgreSQL"],
      概要: `金融機関向けのWebアプリケーションAPI開発案件です。
バックエンドエンジニアとして、REST APIの設計・実装を担当していただきます。
セキュリティ要件が高く、堅牢なシステム開発の経験がある方を歓迎します。`,
      環境: `【開発環境】
・バックエンド: Python 3.11, Django 4.2, Django REST Framework
・DB: PostgreSQL 15
・インフラ: オンプレミス
・その他: GitLab, Jenkins, Docker`,
      必須スキル: `・Python + Djangoでの開発経験 3年以上
・REST APIの設計・実装経験
・PostgreSQLの実務経験
・セキュアコーディングの知識`,
      尚可スキル: `・金融系システムの開発経験
・マイクロサービスアーキテクチャの経験
・CI/CDパイプラインの構築経験
・大規模データ処理の経験`,
      勤務地エリア: "東京都千代田区",
      最寄駅: "大手町駅",
      下限h: 160,
      上限h: 180,
      掲載単価: 80,
      MAX単価: 85,
      案件期間: "12ヶ月〜",
      参画時期: "2026-01-01",
      面談回数: "3回",
      案件特徴: ["安定稼働", "長期案件", "大手直案件", "金融系プロジェクト", "高単価案件"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "元請け",
      契約形態: "準委任",
      リモート可否: "条件付き可",
      外国籍: "不可",
      募集人数: 1,
      新着フラグ: "新着案件",
    },
    // 案件3: フルスタック開発案件 → 人材3が最も適合
    {
      案件名: "スタートアップ向け新規サービス開発",
      ルックアップ: "株式会社テックベンチャー",
      職種_ポジション: ["フロントエンドエンジニア", "バックエンドエンジニア"],
      スキル: ["JavaScript", "Node.js", "React", "AWS"],
      概要: `急成長中のスタートアップ企業で、新規Webサービスの立ち上げメンバーを募集します。
技術選定から携わることができ、裁量を持って開発を進められる環境です。
フロントエンドからバックエンド、インフラまで幅広く対応できる方を歓迎します。`,
      環境: `【開発環境】
・フロントエンド: Next.js 14, TypeScript, TailwindCSS
・バックエンド: Node.js, NestJS, GraphQL
・DB: MongoDB, Redis
・インフラ: AWS (ECS, RDS, S3, CloudFront)
・その他: GitHub, CircleCI, Terraform`,
      必須スキル: `・Next.jsでの開発経験
・Node.jsでのバックエンド開発経験
・TypeScriptの実務経験
・AWSを使った開発・デプロイ経験`,
      尚可スキル: `・スタートアップでの開発経験
・0→1のサービス立ち上げ経験
・技術選定やアーキテクチャ設計の経験
・GraphQL/NoSQLデータベースの使用経験`,
      勤務地エリア: "東京都港区",
      最寄駅: "六本木駅",
      下限h: 140,
      上限h: 180,
      掲載単価: 75,
      MAX単価: 80,
      案件期間: "3ヶ月〜",
      参画時期: "2025-12-15",
      面談回数: "1回",
      案件特徴: ["スタートアップ", "新規開発案件", "フルリモート可", "最新技術導入", "服装自由", "面談1回"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "直",
      契約形態: "業務委託",
      リモート可否: "可",
      外国籍: "可",
      募集人数: 3,
    },
    // 案件4: モバイルアプリ開発案件 → 人材4が最も適合
    {
      案件名: "ヘルスケアアプリ開発案件",
      ルックアップ: "株式会社ヘルステック",
      職種_ポジション: ["モバイル/アプリエンジニア"],
      スキル: ["React Native", "TypeScript", "Firebase"],
      概要: `ヘルスケア領域のモバイルアプリ開発案件です。
React Nativeを使ったクロスプラットフォーム開発を行います。
iOS/Android両方のアプリ開発経験がある方を歓迎します。`,
      環境: `【開発環境】
・モバイル: React Native 0.73, Expo, TypeScript
・バックエンド: Firebase (Auth, Firestore, Functions)
・その他: GitHub, Fastlane, TestFlight`,
      必須スキル: `・React Nativeでの開発経験 2年以上
・TypeScriptの実務経験
・Firebaseを使った開発経験
・iOS/Androidストアへのリリース経験`,
      尚可スキル: `・ヘルスケア/医療系アプリの開発経験
・Swift/Kotlinでのネイティブ開発経験
・アプリのパフォーマンス最適化経験
・CI/CD環境の構築経験`,
      勤務地エリア: "東京都新宿区",
      最寄駅: "新宿駅",
      下限h: 140,
      上限h: 180,
      掲載単価: 72,
      MAX単価: 78,
      案件期間: "6ヶ月〜",
      参画時期: "2026-01-15",
      面談回数: "2回",
      案件特徴: ["リモート併用可", "新規開発案件", "最新技術導入", "週4日～OK"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "直",
      契約形態: "準委任",
      リモート可否: "可",
      外国籍: "可",
      募集人数: 2,
    },
    // 案件5: データエンジニアリング案件 → 人材5が最も適合
    {
      案件名: "データ基盤構築・運用案件",
      ルックアップ: "大手小売業B社",
      職種_ポジション: ["データベースエンジニア", "インフラエンジニア"],
      スキル: ["Python", "BigQuery", "AWS"],
      概要: `大手小売業のデータ基盤構築・運用案件です。
データレイク/データウェアハウスの設計・構築、ETLパイプラインの開発を担当していただきます。
大規模データ処理の経験がある方を歓迎します。`,
      環境: `【開発環境】
・言語: Python 3.11, SQL
・データ基盤: AWS (S3, Glue, Athena, Redshift), BigQuery
・ETL: Apache Airflow, dbt
・インフラ: Terraform, Docker
・その他: GitLab, DataDog`,
      必須スキル: `・Pythonでのデータ処理経験 3年以上
・SQLの高度な知識（Window関数、CTEなど）
・AWSを使ったデータ基盤構築経験
・ETLパイプラインの設計・実装経験`,
      尚可スキル: `・BigQueryの使用経験
・Apache Spark/Airflowの使用経験
・Terraformでのインフラ構築経験
・データ品質管理・ガバナンスの知見`,
      勤務地エリア: "東京都品川区",
      最寄駅: "品川駅",
      下限h: 160,
      上限h: 180,
      掲載単価: 85,
      MAX単価: 90,
      案件期間: "12ヶ月〜",
      参画時期: "2026-02-01",
      面談回数: "2回",
      案件特徴: ["安定稼働", "長期案件", "大手直案件", "高単価案件", "上流工程参画"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "元請け",
      契約形態: "準委任",
      リモート可否: "条件付き可",
      外国籍: "条件付き可",
      募集人数: 2,
    },
  ],

  // 応募履歴 - 各人材が最も適合する案件に応募
  applications: [
    { auth_user_id: "seed_user_001", jobIndex: 0, 対応状況: "応募済み" },
    { auth_user_id: "seed_user_002", jobIndex: 1, 対応状況: "面談調整中" },
    { auth_user_id: "seed_user_003", jobIndex: 2, 対応状況: "案件参画" },
  ],

  // 推薦データ（適合スコア）- マッチングロジックのテスト用
  // 各人材と各案件の適合スコアを事前計算した想定
  recommendations: [
    // 人材1（フロントエンド特化）の適合スコア
    { talentIndex: 0, jobIndex: 0, score: 95 },  // 案件1: 最も適合
    { talentIndex: 0, jobIndex: 1, score: 20 },  // 案件2: 適合度低
    { talentIndex: 0, jobIndex: 2, score: 70 },  // 案件3: ある程度適合
    { talentIndex: 0, jobIndex: 3, score: 60 },  // 案件4: TypeScriptは共通
    { talentIndex: 0, jobIndex: 4, score: 10 },  // 案件5: 適合度低
    // 人材2（バックエンド特化）の適合スコア
    { talentIndex: 1, jobIndex: 0, score: 15 },  // 案件1: 適合度低
    { talentIndex: 1, jobIndex: 1, score: 95 },  // 案件2: 最も適合
    { talentIndex: 1, jobIndex: 2, score: 30 },  // 案件3: Node.jsでやや適合
    { talentIndex: 1, jobIndex: 3, score: 10 },  // 案件4: 適合度低
    { talentIndex: 1, jobIndex: 4, score: 65 },  // 案件5: Pythonは共通
    // 人材3（フルスタック）の適合スコア
    { talentIndex: 2, jobIndex: 0, score: 75 },  // 案件1: React/TS共通
    { talentIndex: 2, jobIndex: 1, score: 25 },  // 案件2: 適合度低
    { talentIndex: 2, jobIndex: 2, score: 98 },  // 案件3: 最も適合
    { talentIndex: 2, jobIndex: 3, score: 55 },  // 案件4: React Native経験なし
    { talentIndex: 2, jobIndex: 4, score: 50 },  // 案件5: AWSは共通
    // 人材4（モバイル特化）の適合スコア
    { talentIndex: 3, jobIndex: 0, score: 45 },  // 案件1: TypeScript共通
    { talentIndex: 3, jobIndex: 1, score: 10 },  // 案件2: 適合度低
    { talentIndex: 3, jobIndex: 2, score: 40 },  // 案件3: TS/Reactの基礎あり
    { talentIndex: 3, jobIndex: 3, score: 95 },  // 案件4: 最も適合
    { talentIndex: 3, jobIndex: 4, score: 15 },  // 案件5: 適合度低
    // 人材5（データエンジニア）の適合スコア
    { talentIndex: 4, jobIndex: 0, score: 5 },   // 案件1: 適合度低
    { talentIndex: 4, jobIndex: 1, score: 55 },  // 案件2: Python/DB共通
    { talentIndex: 4, jobIndex: 2, score: 45 },  // 案件3: AWS共通
    { talentIndex: 4, jobIndex: 3, score: 10 },  // 案件4: 適合度低
    { talentIndex: 4, jobIndex: 4, score: 98 },  // 案件5: 最も適合
  ],
};
