/**
 * 山田・田中テスト用シードデータ（2人+8案件+応募履歴）
 * セット1: yamadaデータ（前からの既存データ）
 *
 * generateDevCreatedAtを引数として受け取るファクトリ関数パターン
 */
export const createSeedData1 = (generateDevCreatedAt: (daysAgo: number) => string) => ({
  authUsers: [
    {
    id: "seed_user_001",
    name: "山田 太郎",
    email: "seed_yamada@example.com",
      password: "password123",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
    {
    id: "seed_user_002",
    name: "田中 花子",
    email: "seed_hanako@example.com",
      password: "password123",
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  ],

  talents: [
    {
    auth_user_id: "seed_user_001",
    姓: "山田",
    名: "太郎",
    氏名: "山田 太郎",
    セイ: "ヤマダ",
    メイ: "タロウ",
    メールアドレス: "seed_yamada@example.com",
    電話番号: "090-1234-5678",
    生年月日: "1990-01-15",
    郵便番号: "150-0001",
    住所: "東京都渋谷区神宮前1-1-1",
    言語_ツール: "JavaScript, TypeScript, React, Next.js, Node.js, Python, Django",
    主な実績_PR_職務経歴: `【経歴概要】
Web系エンジニアとして5年の実務経験があります。
フロントエンド・バックエンドの両方を経験し、特にReact/Next.jsを使ったモダンな開発が得意です。

【主なプロジェクト】
・ECサイトのリニューアル（Next.js + TypeScript）
・社内管理システムの新規開発（React + Django REST Framework）
・レガシーシステムのモダナイゼーション

【アピールポイント】
・要件定義から運用まで一貫して対応可能
・チーム開発の経験豊富
・新しい技術のキャッチアップが早い`,
    ポートフォリオリンク: "https://github.com/yamada-taro",
    稼働可能時期: "2025-12-01",
    希望単価_月額: 70,
    希望勤務日数: "週5",
    希望出社頻度: "週2",
    希望勤務スタイル: ["ハイブリッド", "リモート"],
    希望案件_作業内容: `・モダンなフロントエンド開発（React/Next.js）
・バックエンドAPI開発（Node.js/Python）
・新規サービスの立ち上げ
・技術選定やアーキテクチャ設計にも関わりたい`,
    NG企業: "特になし",
    その他要望: "リモート中心で、フレックスタイム制の案件を希望します。",
  },
    {
    auth_user_id: "seed_user_002",
    姓: "田中",
    名: "花子",
    氏名: "田中 花子",
    セイ: "タナカ",
    メイ: "ハナコ",
    メールアドレス: "seed_hanako@example.com",
    電話番号: "090-2345-6789",
    生年月日: "1992-05-20",
    郵便番号: "160-0001",
    住所: "東京都新宿区西新宿1-1-1",
    言語_ツール: "JavaScript, TypeScript, React, Next.js, Node.js, Python, Django, AWS",
    主な実績_PR_職務経歴: `【経歴概要】
フルスタックエンジニアとして6年の実務経験があります。
フロントエンドからバックエンド、インフラまで幅広く対応可能です。
特にReact/Next.jsとAWSを使った開発が得意です。

【主なプロジェクト】
・スタートアップでの新規サービス立ち上げ（Next.js + Node.js + AWS）
・ECプラットフォームのフルスタック開発
・サーバーレスアーキテクチャへの移行プロジェクト

【アピールポイント】
・0→1のサービス立ち上げ経験豊富
・AWSを使ったインフラ構築・運用経験
・技術選定からデプロイまで一貫して対応可能`,
    ポートフォリオリンク: "https://github.com/hanako-tanaka",
    稼働可能時期: "2025-12-01",
    希望単価_月額: 75,
    希望勤務日数: "週5",
    希望出社頻度: "週1",
    希望勤務スタイル: ["リモート", "ハイブリッド"],
    希望案件_作業内容: `・Next.js/Node.jsでのフルスタック開発
・AWSを使ったインフラ構築
・新規サービスの技術選定・設計
・GraphQL APIの設計・実装`,
    NG企業: "特になし",
    その他要望: "フルリモートで働ける環境を希望します。",
  },
  ],

  jobs: [
    {
      案件名: "【掲載終了】レガシーシステム保守案件",
      ルックアップ: "株式会社テストカンパニー",
      職種_ポジション: ["インフラエンジニア"],
      スキル: ["Linux", "ShellScript", "AWS"],
      概要: `この案件は掲載を終了しています。AIマッチングの対象外となります。
※テスト用のシードデータです。掲載用ステータスが「無」の案件がどのように表示されるかを確認するためのサンプルです。`,
      環境: `【開発環境】
・OS: Linux (CentOS 7)
・言語: ShellScript, Python
・インフラ: AWS (EC2, RDS, S3)
・その他: Ansible, Terraform`,
      必須スキル: `・Linuxサーバー運用経験 3年以上
・ShellScriptの実務経験
・AWSを使った構築・運用経験`,
      尚可スキル: `・構成管理ツール（Ansible等）の使用経験
・監視ツール（Zabbix, CloudWatch等）の運用経験`,
      勤務地エリア: "東京都千代田区",
      最寄駅: "東京駅",
      下限h: 140,
      上限h: 180,
      掲載単価: 65,
      MAX単価: 70,
      案件期間: "終了",
      参画時期: "2025-10-01",
      面談回数: "2回",
      案件特徴: ["長期案件"],
      ラジオボタン: "クローズ",
      ラジオボタン_0: "無",  // 掲載用ステータス = 無（AIマッチング対象外）
      商流: "二次請け",
      契約形態: "準委任",
      リモート可否: "不可",
      外国籍: "不可",
      募集人数: 0,
      作成日時_開発環境: generateDevCreatedAt(1), // 1日前（上位表示）
    },
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
      作成日時_開発環境: generateDevCreatedAt(2), // 2日前（newタグがつく）
    },
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
      作成日時_開発環境: generateDevCreatedAt(3), // 3日前（newタグがつく）
    },
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
      新着フラグ: "新着案件",
      作成日時_開発環境: generateDevCreatedAt(5), // 5日前（newタグがつく）
    },
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
      案件特徴: ["リモート併用可", "新規開発案件", "最新技術導入", "週3日～OK"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "直",
      契約形態: "準委任",
      リモート可否: "可",
      外国籍: "可",
      募集人数: 2,
      作成日時_開発環境: generateDevCreatedAt(14), // 2週間前（newタグがつかない）
    },
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
      作成日時_開発環境: generateDevCreatedAt(30), // 1ヶ月前（newタグがつかない）
    },
    // 3ヶ月前の応募履歴用の案件（jobIndex: 5, 6, 7）
    {
      案件名: "クラウドインフラ構築案件",
      ルックアップ: "大手IT企業C社",
      職種_ポジション: ["インフラエンジニア"],
      スキル: ["AWS", "Terraform", "Kubernetes"],
      概要: `大手IT企業のクラウドインフラ構築案件です。
AWSを中心としたクラウドインフラの設計・構築・運用を担当していただきます。
大規模システムのインフラ構築経験がある方を歓迎します。`,
      環境: `【開発環境】
・インフラ: AWS (EC2, ECS, RDS, S3, CloudFront)
・IaC: Terraform, CloudFormation
・コンテナ: Docker, Kubernetes (EKS)
・その他: GitHub Actions, DataDog`,
      必須スキル: `・AWSでのインフラ構築経験 3年以上
・TerraformでのIaC実装経験
・Docker/Kubernetesの運用経験
・Linuxサーバーの運用経験`,
      尚可スキル: `・マルチクラウド対応の経験
・CI/CDパイプラインの構築経験
・セキュリティ対策の知見
・コスト最適化の経験`,
      勤務地エリア: "東京都港区",
      最寄駅: "新橋駅",
      下限h: 150,
      上限h: 180,
      掲載単価: 80,
      MAX単価: 85,
      案件期間: "6ヶ月〜",
      参画時期: "2026-03-01",
      面談回数: "2回",
      案件特徴: ["大手直案件", "長期案件", "リモート併用可", "最新技術導入"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "直",
      契約形態: "準委任",
      リモート可否: "可",
      外国籍: "可",
      募集人数: 2,
      作成日時_開発環境: generateDevCreatedAt(95), // 3ヶ月前
    },
    {
      案件名: "機械学習プラットフォーム開発案件",
      ルックアップ: "AIベンチャーD社",
      職種_ポジション: ["機械学習エンジニア", "データサイエンティスト"],
      スキル: ["Python", "TensorFlow", "PyTorch"],
      概要: `AIベンチャー企業の機械学習プラットフォーム開発案件です。
機械学習モデルの開発・デプロイ・運用を担当していただきます。
深層学習の実務経験がある方を歓迎します。`,
      環境: `【開発環境】
・言語: Python 3.11
・MLフレームワーク: TensorFlow, PyTorch, scikit-learn
・インフラ: AWS (SageMaker, EC2, S3)
・その他: Jupyter, MLflow, GitHub`,
      必須スキル: `・Pythonでの機械学習開発経験 2年以上
・TensorFlowまたはPyTorchの使用経験
・データ分析・前処理の経験
・機械学習モデルの評価・改善経験`,
      尚可スキル: `・深層学習の実務経験
・MLOpsの経験
・大規模データ処理の経験
・論文実装の経験`,
      勤務地エリア: "東京都文京区",
      最寄駅: "後楽園駅",
      下限h: 140,
      上限h: 180,
      掲載単価: 75,
      MAX単価: 80,
      案件期間: "6ヶ月〜",
      参画時期: "2026-03-15",
      面談回数: "2回",
      案件特徴: ["スタートアップ", "新規開発案件", "リモート併用可", "最新技術導入"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "直",
      契約形態: "準委任",
      リモート可否: "可",
      外国籍: "可",
      募集人数: 1,
      作成日時_開発環境: generateDevCreatedAt(100), // 3ヶ月前
    },
    {
      案件名: "セキュリティ監視・運用案件",
      ルックアップ: "セキュリティ企業E社",
      職種_ポジション: ["セキュリティエンジニア"],
      スキル: ["SIEM", "SOC", "セキュリティ監視"],
      概要: `セキュリティ企業の監視・運用案件です。
SOC（セキュリティオペレーションセンター）での監視・分析・対応を担当していただきます。
セキュリティインシデント対応の経験がある方を歓迎します。`,
      環境: `【開発環境】
・SIEM: Splunk, QRadar
・監視ツール: Wazuh, OSSEC
・その他: ELK Stack, GitHub`,
      必須スキル: `・セキュリティ監視の経験 2年以上
・SIEMツールの使用経験
・ログ分析の経験
・インシデント対応の経験`,
      尚可スキル: `・ペネトレーションテストの経験
・脆弱性診断の経験
・セキュリティ資格（CISSP, CEH等）
・フォレンジックの経験`,
      勤務地エリア: "東京都新宿区",
      最寄駅: "新宿駅",
      下限h: 150,
      上限h: 180,
      掲載単価: 78,
      MAX単価: 83,
      案件期間: "12ヶ月〜",
      参画時期: "2026-04-01",
      面談回数: "2回",
      案件特徴: ["安定稼働", "長期案件", "大手直案件", "リモート併用可"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "直",
      契約形態: "準委任",
      リモート可否: "条件付き可",
      外国籍: "不可",
      募集人数: 2,
      作成日時_開発環境: generateDevCreatedAt(120), // 約4ヶ月前
    },
  ],

  applications: [
    // 応募した順（新しい順）: 案件決定、面談予定、面談調整中、募集終了、応募済み
    { auth_user_id: "seed_user_001", jobIndex: 3, 対応状況: "案件参画", 作成日時_開発環境: generateDevCreatedAt(1) }, // 1日前（最新）
    { auth_user_id: "seed_user_001", jobIndex: 2, 対応状況: "面談予定", 作成日時_開発環境: generateDevCreatedAt(2) }, // 2日前
    { auth_user_id: "seed_user_001", jobIndex: 1, 対応状況: "面談調整中", 作成日時_開発環境: generateDevCreatedAt(3) }, // 3日前
    { auth_user_id: "seed_user_001", jobIndex: 4, 対応状況: "見送り", 作成日時_開発環境: generateDevCreatedAt(4) }, // 4日前
    { auth_user_id: "seed_user_001", jobIndex: 0, 対応状況: "応募済み", 作成日時_開発環境: generateDevCreatedAt(5) }, // 5日前（最古）

    // 3ヶ月以上前の応募履歴（別案件で作成）
    { auth_user_id: "seed_user_001", jobIndex: 5, 対応状況: "応募済み", 作成日時_開発環境: generateDevCreatedAt(95) }, // 約3ヶ月前
    { auth_user_id: "seed_user_001", jobIndex: 6, 対応状況: "見送り", 作成日時_開発環境: generateDevCreatedAt(100) }, // 約3ヶ月前
    { auth_user_id: "seed_user_001", jobIndex: 7, 対応状況: "案件参画", 作成日時_開発環境: generateDevCreatedAt(120) }, // 約4ヶ月前
  ],

  // 推薦データ（表示順確認用）
  // ※ jobIndex 0-4はすべて応募済みなので案件一覧には表示されない
  // ※ 応募済み案件の推薦データも作成（表示順の確認用）
  recommendations: [
    // 応募済み案件（案件一覧には表示されない）
    { talentIndex: 0, jobIndex: 0, score: 85 },  // 応募済み
    { talentIndex: 0, jobIndex: 1, score: 70 },  // 面談調整中
    { talentIndex: 0, jobIndex: 2, score: 90 },  // 面談予定
    { talentIndex: 0, jobIndex: 3, score: 60 },  // 案件参画（案件決定）
    { talentIndex: 0, jobIndex: 4, score: 65 },  // 見送り（募集終了）
  ],

  // 山田太郎（seed_user_001）用の推薦データ
  // 案件一覧に表示される案件（応募していない案件）
  // 担当者おすすめやAIマッチのバッジ表示確認用
  // ※通知数を抑えるため3件に限定
  recommendationsForYamada: [
    // seedData3の案件に対して推薦データを作成（jobIndexは統合後のインデックス）
    // AIマッチのみ
    { talentIndex: 0, jobIndex: 8, score: 95, staffRecommend: false, aiMatched: true },
    { talentIndex: 0, jobIndex: 9, score: 88, staffRecommend: false, aiMatched: true },
    // 担当者おすすめ + AIマッチ（1件のみ）
    { talentIndex: 0, jobIndex: 10, score: 85, staffRecommend: true, aiMatched: true },
  ],

  // 田中花子（seed_user_002）用の推薦データ
  // 案件一覧に表示される案件（応募していない案件）
  // 3つのバッジが同時に表示される案件を含む
  recommendationsForHanako: [
    // jobIndex 0: 大手ECサイトのフロントエンド刷新案件
    // 担当者おすすめ + AIマッチ + New（3つ全部）
    { talentIndex: 1, jobIndex: 0, score: 95, staffRecommend: true, aiMatched: true },

    // jobIndex 1: 金融系WebアプリケーションAPI開発
    // 担当者おすすめ + AIマッチ
    { talentIndex: 1, jobIndex: 1, score: 80, staffRecommend: true, aiMatched: true },

    // jobIndex 2: スタートアップ向け新規サービス開発
    // AIマッチ + New
    { talentIndex: 1, jobIndex: 2, score: 90, staffRecommend: false, aiMatched: true },

    // jobIndex 3: ヘルスケアアプリ開発案件
    // AIマッチ
    { talentIndex: 1, jobIndex: 3, score: 70, staffRecommend: false, aiMatched: true },

    // jobIndex 4: データ基盤構築・運用案件
    // AIマッチ
    { talentIndex: 1, jobIndex: 4, score: 60, staffRecommend: false, aiMatched: true },

    // jobIndex 5: 大規模データから追加（seedData3の最初の案件を参照）
    // AIマッチ
    { talentIndex: 1, jobIndex: 5, score: 75, staffRecommend: false, aiMatched: true },
  ],
});
