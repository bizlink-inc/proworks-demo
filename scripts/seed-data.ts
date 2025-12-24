/**
 * シードデータ作成スクリプト
 * 
 * 使用方法:
 *   npm run seed:create  - シードデータを作成
 *   npm run seed:delete  - シードデータを全件削除
 */

// 環境変数を読み込む
import { config } from "dotenv";
config({ path: ".env.local" });
// .aws-resources.envが存在する場合は読み込む（オプション）
try {
  config({ path: ".aws-resources.env" });
} catch {
  // ファイルが存在しない場合は無視
}

import { createTalentClient, createJobClient, createApplicationClient, createRecommendationClient, createAnnouncementClient, createInquiryClient, getAppIds } from "../lib/kintone/client";
import { uploadFileToKintone } from "../lib/kintone/services/file";
import { TALENT_FIELDS, JOB_FIELDS, APPLICATION_FIELDS, RECOMMENDATION_FIELDS, INQUIRY_FIELDS } from "../lib/kintone/fieldMapping";
import { calculateTopMatches, TalentForMatching, JobForMatching } from "../lib/matching/calculateScore";
import { seedData3 } from "./seed-data-large";
import { getDb, closePool, query, schema, switchDatabase } from "../lib/db/client";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
// Better Authの公式ハッシュ関数を使用
import { hashPassword as hashPasswordBetterAuth } from "better-auth/crypto";
import { auth } from "../lib/auth";

// ランダムID生成（Better Auth互換）
const generateId = (length: number = 32): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 開発環境用の作成日時を生成する関数
// 過去N日前の日時を生成（1週間以内の場合はnewタグがつく）
const generateDevCreatedAt = (daysAgo: number): string => {
  const now = new Date();
  const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  // kintoneのDATETIME形式: YYYY-MM-DDTHH:mm:ssZ
  return targetDate.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

// PostgreSQL データベース接続は lib/db/client.ts から取得

// ダミーファイルをアップロードする関数
const uploadDummyFiles = async (): Promise<Array<{ fileKey: string; name: string; size: string }>> => {
  const dummyFilesDir = path.join(process.cwd(), "scripts", "dummy-files");
  const uploadedFiles: Array<{ fileKey: string; name: string; size: string }> = [];

  // ダミーファイルのリスト（対応形式のみ）
  const dummyFiles = [
    { filename: "職務経歴書_山田太郎.pdf", displayName: "職務経歴書_山田太郎.pdf", contentType: "application/pdf" },
  ];

  for (const dummyFile of dummyFiles) {
    const filePath = path.join(dummyFilesDir, dummyFile.filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ ダミーファイルが見つかりません: ${filePath}`);
      continue;
    }

    try {
      // ファイルを読み込んでFileオブジェクトを作成
      const fileBuffer = fs.readFileSync(filePath);
      const file = new File([fileBuffer], dummyFile.displayName, {
        type: dummyFile.contentType,
      });

      console.log(`📤 ダミーファイルアップロード中: ${dummyFile.displayName}`);
      
      // kintoneにアップロード
      const uploadResult = await uploadFileToKintone(file);
      
      uploadedFiles.push({
        fileKey: uploadResult.fileKey,
        name: uploadResult.fileName,
        size: uploadResult.fileSize.toString(),
      });

      console.log(`✅ アップロード成功: ${dummyFile.displayName} (${uploadResult.fileKey})`);
    } catch (fileError) {
      console.error(`❌ ファイルアップロードエラー (${dummyFile.displayName}):`, fileError);
      // ファイルアップロードエラーが発生しても続行
      continue;
    }
  }

  return uploadedFiles;
};

// ========================================
// セット1: 前のyamadaデータ（1人+5案件+応募履歴）
// ========================================
const seedData1 = {
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
};

// ========================================
// セット2: 新規5人+5案件（適合度設計）
// ========================================
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

// kintone案件DBフィールドの選択肢（ハードコーディング）
// npm run get-fields で取得した値を参考に
const JOB_FIELD_OPTIONS = {
  職種_ポジション: [
    "フロントエンドエンジニア", "QAエンジニア / テスター", "システムエンジニア (SE)", 
    "モバイル/アプリエンジニア", "ネットワークエンジニア", "データサイエンティスト", 
    "PM (プロジェクトマネージャー)", "ゲームエンジニア", "組み込み・制御エンジニア", 
    "AI / MLエンジニア", "UI / UXデザイナー", "Webディレクター", "業務系コンサルタント", 
    "データアナリスト", "データベースエンジニア", "Webデザイナー", "VPoE / CTO / テックリード", 
    "バックエンドエンジニア", "SRE (サイト信頼性エンジニア)", "サーバーエンジニア", 
    "プリセールス", "PL (プロジェクトリーダー)", "ITコンサルタント", 
    "PMO (プロジェクト管理支援)", "セキュリティエンジニア", "インフラエンジニア", 
    "SAPコンサルタント", "クラウドエンジニア", "その他"
  ] as const,
  スキル: [
    "UiPath", "MQTT", "Nginx", "Windows Server", "Shell/Bash", "PostgreSQL", "Eclipse", "Go", 
    "人事/給与", "Google Tag Manager (GTM)", "Check Point", "PyTest", "PyTorch", "VBA", 
    "Docker", "Movable Type", "IPSec / VPN", "MySQL", "Adjust / AppsFlyer", "OSPF / BGP", 
    "AppSheet", "Flutter", "NestJS", "Smarty", "PowerShell", "テスト駆動開発(TDD)", "Rust", 
    "BigQuery", "会計", "Playwright", "DynamoDB", "Perl", "Apache", "Hyperledger Fabric", 
    "Drupal", "IIS", "JCL", "C言語", "Ruby on Rails", "Symfony", "Magento", "Cisco", 
    "Struts", "Swift", "Zend Framework", "ARM", "SD-WAN", "C#", "Xamarin", "VB.NET", 
    "Xcode", "Adalo", "IntelliJ IDEA", "Hugging Face", "Next.js", "Shopify", "マイクロサービス", 
    "Adobe Analytics", "Webflow", "スクラム", "After Effects", "GitHub Actions", "Sinatra", 
    "Terraform", "Solidity", "Ethereum", "PHP", "Objective-C", "Teams", "Tornado", "Backlog", 
    "Android Studio", "Alpine.js", "GitLab", "TensorFlow", "Java", "Firebase", "R言語", 
    "Express", "COBOL", "LangChain", "Nuxt.js", "Appium", "Tailwind CSS", "SQL Server", 
    "医療", "Kotlin", "Figma", "Palo Alto", "FortiGate", "Bulma", "Jetson", "Django", 
    "Svelte / SvelteKit", "Cypress", "CI/CD", "ASP.NET", "LlamaIndex", "RTOS", "VMware", 
    "HubSpot", "Juniper", "Oracle Database", "Canva", "BizRobo!", "RSpec", "Redmine", 
    "Spring Boot", "ITRON", "WPF", "WordPress", "Bubble", "Snowflake", "ウォーターフォール", 
    "Power Automate / Power Apps", "Entity Framework", "Selenium", "NFT", "Python", "z/OS", 
    "Azure", "Gatsby", "Google Analytics 4 (GA4)", "Node.js", "Visual Studio", "Google Cloud (GCP)", 
    "FlutterFlow", "Redshift", "UNIX", "Jenkins", "Vue.js", "OpenAI API", "DevOps", "Git", 
    "Unity", "Slack", "CodeIgniter", "JSF (JavaServer Faces) / JSP", "Illustrator", "Ansible", 
    "F5 / BIG-IP", "MongoDB", "Arduino", "Dart", "Material UI", "Chakra UI", "Raspberry Pi", 
    "Adobe XD", "GitHub", "RPG", "Laravel", "Linux (RHEL, CentOS, Ubuntu)", "Angular", "金融", 
    "TypeScript", "Sass / SCSS", "PL/I", "JUnit", "JavaScript", "Electron", "Bootstrap", 
    "Zoom", "CakePHP", "Yamaha", "Ruby", "AWS", "CircleCI", "Flask", "Salesforce", "Jest", 
    "C++", "アジャイル", "Scala", "AS/400 (IBM i)", "BLE (Bluetooth Low Energy)", "Scikit-learn", 
    "Redis", "React", "Jira", "kintone", "Prompt Engineering", "jQuery", "WinActor", "Seasar2", 
    "物流", "Pandas", "Active Directory (AD)", "EC-CUBE", "FastAPI", "React Native", "Photoshop", 
    "Kubernetes"
  ] as const,
  案件特徴: [
    "安定稼働", "週3日～OK", "グローバル案件", "即日参画OK", "自社サービス案件", "リーダー募集", 
    "金融系プロジェクト", "若手活躍中", "大規模開発", "短期案件", "大手直案件", "アジャイル開発", 
    "支払いサイト短め", "上流工程参画", "1人称対応可", "スタートアップ", "新規開発案件", 
    "官公庁関連", "チーム開発", "フルスタック歓迎", "常駐案件", "ベテラン歓迎", "面談1回", 
    "高単価案件", "商社グループ案件", "最新技術導入", "服装自由", "長期案件", "リモート併用可", 
    "フルリモート可", "スキル見合い単価", "PMO・リーダー案件", "クラウド環境（AWS／Azure／GCP）", 
    "副業OK"
  ] as const,
} as const;

// 選択肢をフィルタリングする（存在する値のみを返す）
const filterValidOptions = (values: string[], validOptions: readonly string[]): string[] => {
  return values.filter(v => validOptions.includes(v as any));
};

// シードデータ作成（Yamada + 50人50案件を統合、推薦DBも自動作成）
export const createSeedData = async () => {
  console.log("\n🌱 シードデータを作成します...\n");
  
  // seedData1とseedData3を統合（重複を除去）
  // seedData1を優先し、seedData3から重複するユーザーIDとメールアドレスを除外
  const seedData1UserIds = new Set(seedData1.authUsers.map(u => u.id));
  const seedData1Emails = new Set(seedData1.authUsers.map(u => u.email));
  
  const uniqueSeedData3Users = seedData3.authUsers.filter(u => 
    !seedData1UserIds.has(u.id) && !seedData1Emails.has(u.email)
  );
  
  const combinedAuthUsers = [...seedData1.authUsers, ...uniqueSeedData3Users];
  
  // talentsも同様に重複を除去（auth_user_idでチェック）
  const seedData1TalentIds = new Set(seedData1.talents.map(t => t.auth_user_id));
  const uniqueSeedData3Talents = seedData3.talents.filter(t => 
    !seedData1TalentIds.has(t.auth_user_id)
  );
  const combinedTalents = [...seedData1.talents, ...uniqueSeedData3Talents];
  
  // jobsとapplicationsは重複がない想定なのでそのまま統合
  const combinedJobs = [...seedData1.jobs, ...seedData3.jobs];
  const combinedApplications = [...seedData1.applications, ...seedData3.applications];
  
  // 統合データ
  const seedData = {
    authUsers: combinedAuthUsers,
    talents: combinedTalents,
    jobs: combinedJobs,
    applications: combinedApplications,
    recommendations: seedData1.recommendations, // seedData1の推薦データを使用（yamada用）
  };
  
  console.log(`📊 データ: ユーザー${combinedAuthUsers.length}人, 人材${combinedTalents.length}人, 案件${combinedJobs.length}件, 応募${combinedApplications.length}件`);

  try {
    const appIds = getAppIds();
    const talentClient = createTalentClient();
    const jobClient = createJobClient();
    const applicationClient = createApplicationClient();

    // 1. Better Authユーザーを作成（Dualモード時はスキップ）
    const skipAuthUserCreation = process.env.SEED_KINTONE_ONLY === "true";
    if (skipAuthUserCreation) {
      console.log(`\n[1/6] Better Authユーザー作成をスキップ（Dualモード）`);
    } else {
      console.log(`\n[1/6] Better Authユーザーを作成中...`);
    }

    const authUserIds: string[] = [];
    const db = getDb();

    // 既存ユーザーのIDとメールアドレスを取得（tryブロック外で定義）
    const existingEmails = new Map<string, string>();
    const existingIds = new Map<string, string>();
    const existingEmailsForMapping = new Map<string, string>();
    const existingIdsForMapping = new Map<string, string>();

    // Kintoneのみモードの場合、auth_user_idはシードデータから取得（DB操作不要）
    if (skipAuthUserCreation) {
      for (const user of seedData.authUsers) {
        authUserIds.push(user.id);
      }
      console.log(`   → シードデータから${authUserIds.length}人のIDを取得`);
    } else {
      try {
        const existingRows = await db.select({ email: schema.user.email, id: schema.user.id }).from(schema.user);
        for (const row of existingRows) {
          existingEmails.set(row.email, row.id);
          existingIds.set(row.id, row.id);
          existingEmailsForMapping.set(row.email, row.id);
          existingIdsForMapping.set(row.id, row.id);
        }

        // 新規ユーザーをフィルタリング（メールアドレスまたはユーザーIDで既存チェック）
        const newUsers = seedData.authUsers.filter(user => {
          // ユーザーIDが指定されている場合はIDでチェック、そうでない場合はメールアドレスでチェック
          if (user.id) {
            return !existingIds.has(user.id) && !existingEmails.has(user.email);
          }
          return !existingEmails.has(user.email);
        });
        const skippedUsers = seedData.authUsers.filter(user => {
          if (user.id) {
            return existingIds.has(user.id) || existingEmails.has(user.email);
          }
          return existingEmails.has(user.email);
        });

        // スキップされるユーザーのIDを追加
        for (const user of skippedUsers) {
          const existingId = user.id && existingIds.has(user.id)
            ? existingIds.get(user.id)!
            : existingEmails.get(user.email)!;
          authUserIds.push(existingId);
        }

        if (skippedUsers.length > 0) {
          console.log(`   既存ユーザー: ${skippedUsers.length}人（スキップ）`);
        }

        if (newUsers.length > 0) {
          // パスワードは全員同じなので、一度だけハッシュ化
          const hashedPassword = await hashPasswordBetterAuth("password123");
          const now = new Date();

          // ユーザーとアカウントのレコードを一括で準備
          const userRecords: any[] = [];
          const accountRecords: any[] = [];

          for (const user of newUsers) {
            const userId = user.id || generateId(32);
            const accountId = generateId(32);

            userRecords.push({
              id: userId,
              name: user.name,
              email: user.email,
              emailVerified: true,
              image: null,
              createdAt: now,
              updatedAt: now,
            });

            accountRecords.push({
              id: accountId,
              userId: userId,
              accountId: userId,
              providerId: "credential",
              password: hashedPassword,
              createdAt: now,
              updatedAt: now,
            });

            authUserIds.push(userId);
          }

          // 一括挿入
          if (userRecords.length > 0) {
            await db.insert(schema.user).values(userRecords);
            await db.insert(schema.account).values(accountRecords);
          }

          console.log(`   新規作成: ${newUsers.length}人`);
        }

        console.log(`   → 合計${authUserIds.length}人を処理完了`);

        // auth_user_idマッピングを作成（seedData.authUsersの順序で）
        // seedData.authUsersの各ユーザーに対応するIDをマッピング
        const authUserIdMap = new Map<string, string>();
        for (let i = 0; i < seedData.authUsers.length; i++) {
          const user = seedData.authUsers[i];
          const userId = user.id || authUserIds[i] || existingEmails.get(user.email);
          if (userId) {
            authUserIdMap.set(user.id || user.email, userId);
          }
        }

      } catch (error) {
        console.error("ユーザー作成エラー:", error);
        throw error;
      }
    }

    // 2. 人材DBにレコード作成
    console.log(`\n[2/6] 人材DBにレコードを作成中...`);

    // 2-0. 田中 花子 用の職務経歴書PDFをアップロード（テスト用）
    // Backend_Engineer_Resume_sample.pdf を kintone にアップロードし、
    // 田中 花子（auth_user_id = seed_user_002）のみファイルを紐付け、テキストは空にする
    const hanakoAuthUserId = "seed_user_002";
    let hanakoResumeFiles: Array<{ fileKey: string; name: string; size: string }> = [];

    try {
      const resumePath = path.join(process.cwd(), "test-file", "Backend_Engineer_Resume_sample.pdf");
      if (fs.existsSync(resumePath)) {
        const fileBuffer = fs.readFileSync(resumePath);
        const resumeFile = new File([fileBuffer], "Backend_Engineer_Resume_sample.pdf", {
          type: "application/pdf",
        });
        const uploadResult = await uploadFileToKintone(resumeFile);
        hanakoResumeFiles = [
          {
            fileKey: uploadResult.fileKey,
            name: uploadResult.fileName,
            size: uploadResult.fileSize.toString(),
          },
        ];
      }
    } catch (uploadError) {
      // ファイルアップロードエラーは無視して続行
    }

    const talentRecords = seedData.talents.map((talent) => {
      // talentのauth_user_idに対応するユーザーIDを検索
      // 1. seedData.authUsersから該当するユーザーを検索（auth_user_idまたはメールアドレスで）
      const matchingUser = seedData.authUsers.find(u => 
        u.id === talent.auth_user_id || u.email === talent.メールアドレス
      );
      
      let userId: string | undefined;
      if (matchingUser) {
        // マッチしたユーザーのIDを取得
        if (matchingUser.id && existingIdsForMapping.has(matchingUser.id)) {
          userId = existingIdsForMapping.get(matchingUser.id);
        } else if (existingEmailsForMapping.has(matchingUser.email)) {
          userId = existingEmailsForMapping.get(matchingUser.email);
        } else {
          // 新規作成されたユーザーのIDを検索
          const userIndex = seedData.authUsers.indexOf(matchingUser);
          userId = authUserIds[userIndex];
        }
      } else {
        // マッチしない場合は、auth_user_idを直接使用
        userId = talent.auth_user_id;
      }

      if (!userId) {
        throw new Error(`ユーザーIDが見つかりません: ${talent.氏名} (${talent.メールアドレス})`);
      }

      // 田中 花子（auth_user_id = seed_user_002）はテキストを空にし、
      // 職務経歴書ファイルのみを設定する
      const isHanako = talent.auth_user_id === hanakoAuthUserId;
      const experienceValue = isHanako ? "" : talent.主な実績_PR_職務経歴;
      const resumeFilesValue = isHanako ? hanakoResumeFiles : [];

      return {
        [TALENT_FIELDS.AUTH_USER_ID]: { value: userId },
        [TALENT_FIELDS.LAST_NAME]: { value: talent.姓 },
        [TALENT_FIELDS.FIRST_NAME]: { value: talent.名 },
        [TALENT_FIELDS.FULL_NAME]: { value: talent.氏名 },
        [TALENT_FIELDS.LAST_NAME_KANA]: { value: talent.セイ },
        [TALENT_FIELDS.FIRST_NAME_KANA]: { value: talent.メイ },
        [TALENT_FIELDS.EMAIL]: { value: talent.メールアドレス },
        [TALENT_FIELDS.PHONE]: { value: talent.電話番号 },
        [TALENT_FIELDS.BIRTH_DATE]: { value: talent.生年月日 },
        [TALENT_FIELDS.POSTAL_CODE]: { value: talent.郵便番号 },
        [TALENT_FIELDS.ADDRESS]: { value: talent.住所 },
        [TALENT_FIELDS.SKILLS]: { value: talent.言語_ツール },
        [TALENT_FIELDS.EXPERIENCE]: { value: experienceValue },
        [TALENT_FIELDS.RESUME_FILES]: { value: resumeFilesValue },
        [TALENT_FIELDS.PORTFOLIO_URL]: { value: talent.ポートフォリオリンク },
        [TALENT_FIELDS.AVAILABLE_FROM]: { value: talent.稼働可能時期 },
        [TALENT_FIELDS.DESIRED_RATE]: { value: talent.希望単価_月額 },
        [TALENT_FIELDS.DESIRED_WORK_DAYS]: { value: talent.希望勤務日数 },
        [TALENT_FIELDS.DESIRED_COMMUTE]: { value: talent.希望出社頻度 },
        [TALENT_FIELDS.DESIRED_WORK_STYLE]: { value: talent.希望勤務スタイル },
        [TALENT_FIELDS.DESIRED_WORK]: { value: talent.希望案件_作業内容 },
        [TALENT_FIELDS.NG_COMPANIES]: { value: talent.NG企業 },
        [TALENT_FIELDS.OTHER_REQUESTS]: { value: talent.その他要望 },
      };
    });

    const talentCreateResult = await talentClient.record.addRecords({
      app: appIds.talent,
      records: talentRecords,
    });

    const talentRecordIds = talentCreateResult.ids;
    console.log(`   → ${talentRecordIds.length}人を作成完了`);

    // 3. 案件DBにレコード作成
    console.log(`\n[3/6] 案件DBにレコードを作成中...`);

    const jobRecords = seedData.jobs.map((job) => {
      // 選択肢をフィルタリング（kintoneに存在する値のみを使用）
      const validPositions = filterValidOptions(job.職種_ポジション, JOB_FIELD_OPTIONS.職種_ポジション);
      const validSkills = filterValidOptions(job.スキル, JOB_FIELD_OPTIONS.スキル);
      const validFeatures = filterValidOptions(job.案件特徴, JOB_FIELD_OPTIONS.案件特徴);

      return {
          案件名: { value: job.案件名 },
        職種_ポジション: { value: validPositions },
        スキル: { value: validSkills },
          概要: { value: job.概要 },
          環境: { value: job.環境 },
          必須スキル: { value: job.必須スキル },
          尚可スキル: { value: job.尚可スキル },
          勤務地エリア: { value: job.勤務地エリア },
          最寄駅: { value: job.最寄駅 },
          下限h: { value: job.下限h },
          上限h: { value: job.上限h },
          掲載単価: { value: job.掲載単価 },
          数値_0: { value: job.MAX単価 },
          案件期間: { value: job.案件期間 },
          日付: { value: job.参画時期 },
          面談回数: { value: job.面談回数 },
        案件特徴: { value: validFeatures },
          ラジオボタン: { value: job.ラジオボタン },
          ラジオボタン_0: { value: job.ラジオボタン_0 },
          商流: { value: job.商流 },
          契約形態: { value: job.契約形態 },
          リモート可否: { value: job.リモート可否 },
          外国籍: { value: job.外国籍 },
          数値: { value: job.募集人数 },
          新着フラグ: { value: job.新着フラグ || "" },
          作成日時_開発環境: job.作成日時_開発環境 ? { value: job.作成日時_開発環境 } : undefined,
      };
      });

    const jobCreateResult = await jobClient.record.addRecords({
      app: appIds.job,
      records: jobRecords,
      });

    const jobIds = jobCreateResult.ids;
    console.log(`   → ${jobIds.length}件を作成完了`);

    // 4. 応募履歴DBにレコード作成
    console.log(`\n[4/6] 応募履歴DBにレコードを作成中...`);

    const applicationRecords = seedData.applications.map((application: any) => {
      // auth_user_idに対応するユーザーIDを検索
      const matchingUser = seedData.authUsers.find(u => u.id === application.auth_user_id);
      let authUserId: string | undefined;
      
      if (matchingUser) {
        // マッチしたユーザーのIDを取得
        if (matchingUser.id && existingIdsForMapping.has(matchingUser.id)) {
          authUserId = existingIdsForMapping.get(matchingUser.id);
        } else if (existingEmailsForMapping.has(matchingUser.email)) {
          authUserId = existingEmailsForMapping.get(matchingUser.email);
        } else {
          // 新規作成されたユーザーのIDを検索
          const userIndex = seedData.authUsers.indexOf(matchingUser);
          authUserId = authUserIds[userIndex];
        }
      } else {
        // マッチしない場合は、auth_user_idを直接使用
        authUserId = application.auth_user_id;
      }

      if (!authUserId) {
        throw new Error(`ユーザーIDが見つかりません: auth_user_id=${application.auth_user_id}`);
      }

      const jobId = jobIds[application.jobIndex];

      const record: any = {
        [APPLICATION_FIELDS.AUTH_USER_ID]: { value: authUserId },
        [APPLICATION_FIELDS.JOB_ID]: { value: jobId },
        [APPLICATION_FIELDS.STATUS]: { value: application.対応状況 },
      };

      // 作成日時_開発環境が指定されている場合は追加
      if (application.作成日時_開発環境) {
        record[APPLICATION_FIELDS.CREATED_AT_DEV] = { value: application.作成日時_開発環境 };
      }

      return record;
    });

    if (applicationRecords.length > 0) {
      const applicationCreateResult = await applicationClient.record.addRecords({
          app: appIds.application,
        records: applicationRecords,
        });
      console.log(`   → ${applicationCreateResult.ids.length}件を作成完了`);
    } else {
      console.log(`   → 作成対象なし`);
      }

    // 5. 推薦データを作成（マッチングスコア計算）
    console.log(`\n[5/6] 推薦データを作成中（マッチングスコア計算）...`);

    const recommendationClient = createRecommendationClient();

    // マッチング計算用の人材データを準備
    // talentRecordIdsとauthUserIdのマッピングを作成
    const talentAuthUserIdMap = new Map<string, string>();
    for (let i = 0; i < seedData.talents.length; i++) {
      const talent = seedData.talents[i];
      const matchingUser = seedData.authUsers.find(u => 
        u.id === talent.auth_user_id || u.email === talent.メールアドレス
      );
      
      let userId: string | undefined;
      if (matchingUser) {
        if (matchingUser.id && existingIdsForMapping.has(matchingUser.id)) {
          userId = existingIdsForMapping.get(matchingUser.id);
        } else if (existingEmailsForMapping.has(matchingUser.email)) {
          userId = existingEmailsForMapping.get(matchingUser.email);
        } else {
          const userIndex = seedData.authUsers.indexOf(matchingUser);
          userId = authUserIds[userIndex];
        }
      } else {
        userId = talent.auth_user_id;
      }
      
      if (userId && talentRecordIds[i]) {
        talentAuthUserIdMap.set(talentRecordIds[i], userId);
      }
    }

    const talentsForMatching: TalentForMatching[] = seedData.talents.map((talent, i) => {
      const matchingUser = seedData.authUsers.find(u => 
        u.id === talent.auth_user_id || u.email === talent.メールアドレス
      );
      
      let userId: string | undefined;
      if (matchingUser) {
        if (matchingUser.id && existingIdsForMapping.has(matchingUser.id)) {
          userId = existingIdsForMapping.get(matchingUser.id);
        } else if (existingEmailsForMapping.has(matchingUser.email)) {
          userId = existingEmailsForMapping.get(matchingUser.email);
        } else {
          const userIndex = seedData.authUsers.indexOf(matchingUser);
          userId = authUserIds[userIndex];
        }
      } else {
        userId = talent.auth_user_id;
      }

      return {
        id: talentRecordIds[i],
        authUserId: userId || talent.auth_user_id,
        name: talent.氏名,
        positions: [], // シードデータには職種の選択肢がない場合がある
        skills: talent.言語_ツール,
        experience: talent.主な実績_PR_職務経歴,
        desiredRate: String(talent.希望単価_月額),
      };
    });

    // 全案件に対してマッチングスコアを計算し、推薦レコードを作成
    const allRecommendationRecords: any[] = [];

    for (let jobIndex = 0; jobIndex < seedData.jobs.length; jobIndex++) {
      const job = seedData.jobs[jobIndex];
      const jobId = jobIds[jobIndex];

      // マッチング計算用の案件データを準備
      const jobForMatching: JobForMatching = {
        id: jobId,
        jobId: jobId,
        title: job.案件名,
        positions: job.職種_ポジション || [],
        skills: job.スキル || [],
      };

      // 特定案件（大手ECサイトのフロントエンド刷新案件）は
      // 山田太郎 → 田中花子 の順になるようにスコアを再調整する
      const isTargetFrontendJob =
        job.案件名 === "大手ECサイトのフロントエンド刷新案件";

      if (isTargetFrontendJob) {
        // すべての人材を対象にスコアを計算（件数分取得）
        const allMatches = calculateTopMatches(
          talentsForMatching,
          jobForMatching,
          talentsForMatching.length
        );

        const yamadaAuthUserId = "seed_user_001";
        const hanakoAuthUserIdForRec = "seed_user_002";

        const yamadaMatch = allMatches.find(
          (m) => m.talentAuthUserId === yamadaAuthUserId
        );
        const hanakoMatch = allMatches.find(
          (m) => m.talentAuthUserId === hanakoAuthUserIdForRec
        );

        const otherMatches = allMatches.filter(
          (m) =>
            m.talentAuthUserId !== yamadaAuthUserId &&
            m.talentAuthUserId !== hanakoAuthUserIdForRec
        );

        const reorderedMatches: typeof allMatches = [];

        if (yamadaMatch) {
          reorderedMatches.push({
            ...yamadaMatch,
            // 山田太郎を1位に固定（十分高いスコアにする）
            score: Math.max(yamadaMatch.score, 100),
          });
        }

        if (hanakoMatch) {
          const yamadaScore = reorderedMatches[0]?.score ?? 100;
          reorderedMatches.push({
            ...hanakoMatch,
            // 田中花子は2位に来るように、山田より少し低いスコアを付与
            score: Math.max(
              hanakoMatch.score,
              yamadaScore > 0 ? yamadaScore - 1 : 95
            ),
          });
        }

        // 残りは元のスコア順のまま後ろに付ける
        reorderedMatches.push(...otherMatches);

        const finalMatches = reorderedMatches.slice(0, 10);

        for (const match of finalMatches) {
          if (!match.talentAuthUserId) continue;
          // 山田太郎は recommendationsForYamada で別途管理するため除外
          if (match.talentAuthUserId === "seed_user_001") continue;

          allRecommendationRecords.push({
            [RECOMMENDATION_FIELDS.TALENT_ID]: { value: match.talentAuthUserId },
            [RECOMMENDATION_FIELDS.JOB_ID]: { value: jobId },
            [RECOMMENDATION_FIELDS.SCORE]: { value: match.score },
          });
        }
      } else {
        // その他の案件は通常通り上位10件を計算
        const topMatches = calculateTopMatches(talentsForMatching, jobForMatching, 10);

        for (const match of topMatches) {
          if (!match.talentAuthUserId) continue;
          // 山田太郎は recommendationsForYamada で別途管理するため除外
          if (match.talentAuthUserId === "seed_user_001") continue;

          allRecommendationRecords.push({
            [RECOMMENDATION_FIELDS.TALENT_ID]: { value: match.talentAuthUserId },
            [RECOMMENDATION_FIELDS.JOB_ID]: { value: jobId },
            [RECOMMENDATION_FIELDS.SCORE]: { value: match.score },
          });
        }
      }

    }

    // 推薦レコードを一括作成（100件ずつバッチ処理）
    if (allRecommendationRecords.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < allRecommendationRecords.length; i += batchSize) {
        const batch = allRecommendationRecords.slice(i, i + batchSize);
        await recommendationClient.record.addRecords({
          app: appIds.recommendation,
          records: batch,
        });
      }
      console.log(`   → ${allRecommendationRecords.length}件を作成完了`);
    }

    // yamada用の推薦データを追加（表示順確認用）
    let yamadaRecommendationCount = 0;
    if (seedData.recommendations.length > 0 || seedData1.recommendationsForYamada?.length > 0) {
      // yamadaのauth_user_idを取得
      const yamadaUser = seedData1.authUsers[0];
      let yamadaAuthUserId: string | undefined;

      if (yamadaUser.id && existingIdsForMapping.has(yamadaUser.id)) {
        yamadaAuthUserId = existingIdsForMapping.get(yamadaUser.id);
      } else if (existingEmailsForMapping.has(yamadaUser.email)) {
        yamadaAuthUserId = existingEmailsForMapping.get(yamadaUser.email);
      } else {
        const userIndex = seedData.authUsers.findIndex(u => u.id === yamadaUser.id || u.email === yamadaUser.email);
        yamadaAuthUserId = userIndex >= 0 ? authUserIds[userIndex] : yamadaUser.id;
      }

      if (yamadaAuthUserId) {
        const yamadaRecommendationRecords: any[] = [];

        // 応募済み案件の推薦データ
        for (const recommendation of seedData.recommendations) {
          if (recommendation.jobIndex < seedData1.jobs.length) {
            const jobId = jobIds[recommendation.jobIndex];
            yamadaRecommendationRecords.push({
              [RECOMMENDATION_FIELDS.TALENT_ID]: { value: yamadaAuthUserId },
              [RECOMMENDATION_FIELDS.JOB_ID]: { value: jobId },
              [RECOMMENDATION_FIELDS.SCORE]: { value: recommendation.score.toString() },
            });
          }
        }

        // 案件一覧に表示される案件の推薦データ
        if (seedData1.recommendationsForYamada && seedData1.recommendationsForYamada.length > 0) {
          for (const recommendation of seedData1.recommendationsForYamada) {
            if (recommendation.jobIndex < jobIds.length) {
              const jobId = jobIds[recommendation.jobIndex];
              const record: any = {
                [RECOMMENDATION_FIELDS.TALENT_ID]: { value: yamadaAuthUserId },
                [RECOMMENDATION_FIELDS.JOB_ID]: { value: jobId },
                [RECOMMENDATION_FIELDS.SCORE]: { value: recommendation.score.toString() },
              };
              if (recommendation.staffRecommend) {
                record[RECOMMENDATION_FIELDS.STAFF_RECOMMEND] = { value: "おすすめ" };
              }
              if (recommendation.aiMatched) {
                record[RECOMMENDATION_FIELDS.AI_EXECUTION_STATUS] = { value: "実行済み" };
                record[RECOMMENDATION_FIELDS.AI_OVERALL_SCORE] = { value: "85" };
                record[RECOMMENDATION_FIELDS.AI_SKILL_SCORE] = { value: "90" };
                record[RECOMMENDATION_FIELDS.AI_PROCESS_SCORE] = { value: "85" };
                record[RECOMMENDATION_FIELDS.AI_INFRA_SCORE] = { value: "80" };
                record[RECOMMENDATION_FIELDS.AI_DOMAIN_SCORE] = { value: "75" };
                record[RECOMMENDATION_FIELDS.AI_TEAM_SCORE] = { value: "90" };
                record[RECOMMENDATION_FIELDS.AI_TOOL_SCORE] = { value: "85" };
                record[RECOMMENDATION_FIELDS.AI_RESULT] = { value: "この案件は候補者のスキルセットと非常にマッチしています。" };
                record[RECOMMENDATION_FIELDS.AI_EXECUTED_AT] = { value: new Date().toISOString() };
              }
              yamadaRecommendationRecords.push(record);
            }
          }
        }

        if (yamadaRecommendationRecords.length > 0) {
          // 既存レコードを一括取得
          const existingRecs = await recommendationClient.record.getAllRecords({
            app: appIds.recommendation,
            condition: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${yamadaAuthUserId}"`,
          });
          const existingMap = new Map<string, string>();
          for (const rec of existingRecs as any[]) {
            existingMap.set(rec[RECOMMENDATION_FIELDS.JOB_ID].value, rec.$id.value);
          }

          // 更新と追加を分離
          const toUpdate: any[] = [];
          const toAdd: any[] = [];
          for (const rec of yamadaRecommendationRecords) {
            const jobId = rec[RECOMMENDATION_FIELDS.JOB_ID].value;
            const existingId = existingMap.get(jobId);
            if (existingId) {
              toUpdate.push({ id: existingId, record: rec });
            } else {
              toAdd.push(rec);
            }
          }

          // 一括更新
          if (toUpdate.length > 0) {
            await recommendationClient.record.updateRecords({
              app: appIds.recommendation,
              records: toUpdate,
            });
          }
          // 一括追加
          if (toAdd.length > 0) {
            await recommendationClient.record.addRecords({
              app: appIds.recommendation,
              records: toAdd,
            });
          }
          yamadaRecommendationCount = yamadaRecommendationRecords.length;
          console.log(`   → yamada用: ${yamadaRecommendationCount}件を処理完了`);
        }
      }
    }

    // 田中花子用の推薦データを追加（バッジ表示確認用）
    let hanakoRecommendationCount = 0;
    if (seedData1.recommendationsForHanako && seedData1.recommendationsForHanako.length > 0) {
      const hanakoUser = seedData1.authUsers[1];
      let hanakoAuthUserId: string | undefined;

      if (hanakoUser.id && existingIdsForMapping.has(hanakoUser.id)) {
        hanakoAuthUserId = existingIdsForMapping.get(hanakoUser.id);
      } else if (existingEmailsForMapping.has(hanakoUser.email)) {
        hanakoAuthUserId = existingEmailsForMapping.get(hanakoUser.email);
      } else {
        const userIndex = seedData.authUsers.findIndex(u => u.id === hanakoUser.id || u.email === hanakoUser.email);
        hanakoAuthUserId = userIndex >= 0 ? authUserIds[userIndex] : hanakoUser.id;
      }

      if (hanakoAuthUserId) {
        const hanakoRecommendationRecords: any[] = [];

        for (const recommendation of seedData1.recommendationsForHanako) {
          if (recommendation.jobIndex < jobIds.length) {
            const jobId = jobIds[recommendation.jobIndex];
            const record: any = {
              [RECOMMENDATION_FIELDS.TALENT_ID]: { value: hanakoAuthUserId },
              [RECOMMENDATION_FIELDS.JOB_ID]: { value: jobId },
              [RECOMMENDATION_FIELDS.SCORE]: { value: recommendation.score.toString() },
            };
            if (recommendation.staffRecommend) {
              record[RECOMMENDATION_FIELDS.STAFF_RECOMMEND] = { value: "おすすめ" };
            }
            if (recommendation.aiMatched) {
              record[RECOMMENDATION_FIELDS.AI_EXECUTION_STATUS] = { value: "実行済み" };
              record[RECOMMENDATION_FIELDS.AI_OVERALL_SCORE] = { value: "85" };
              record[RECOMMENDATION_FIELDS.AI_SKILL_SCORE] = { value: "90" };
              record[RECOMMENDATION_FIELDS.AI_PROCESS_SCORE] = { value: "85" };
              record[RECOMMENDATION_FIELDS.AI_INFRA_SCORE] = { value: "80" };
              record[RECOMMENDATION_FIELDS.AI_DOMAIN_SCORE] = { value: "75" };
              record[RECOMMENDATION_FIELDS.AI_TEAM_SCORE] = { value: "90" };
              record[RECOMMENDATION_FIELDS.AI_TOOL_SCORE] = { value: "85" };
              record[RECOMMENDATION_FIELDS.AI_RESULT] = { value: "この案件は候補者のスキルセットと非常にマッチしています。" };
              record[RECOMMENDATION_FIELDS.AI_EXECUTED_AT] = { value: new Date().toISOString() };
            }
            hanakoRecommendationRecords.push(record);
          }
        }

        if (hanakoRecommendationRecords.length > 0) {
          // 既存レコードを一括取得
          const existingRecs = await recommendationClient.record.getAllRecords({
            app: appIds.recommendation,
            condition: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${hanakoAuthUserId}"`,
          });
          const existingMap = new Map<string, string>();
          for (const rec of existingRecs as any[]) {
            existingMap.set(rec[RECOMMENDATION_FIELDS.JOB_ID].value, rec.$id.value);
          }

          // 更新と追加を分離
          const toUpdate: any[] = [];
          const toAdd: any[] = [];
          for (const rec of hanakoRecommendationRecords) {
            const jobId = rec[RECOMMENDATION_FIELDS.JOB_ID].value;
            const existingId = existingMap.get(jobId);
            if (existingId) {
              toUpdate.push({ id: existingId, record: rec });
            } else {
              toAdd.push(rec);
            }
          }

          // 一括更新
          if (toUpdate.length > 0) {
            await recommendationClient.record.updateRecords({
              app: appIds.recommendation,
              records: toUpdate,
            });
          }
          // 一括追加
          if (toAdd.length > 0) {
            await recommendationClient.record.addRecords({
              app: appIds.recommendation,
              records: toAdd,
            });
          }
          hanakoRecommendationCount = hanakoRecommendationRecords.length;
          console.log(`   → hanako用: ${hanakoRecommendationCount}件を処理完了`);
        }
      }
    }

    // 6. システム通知のシードデータを作成
    console.log(`\n[6/6] システム通知を作成中...`);
    
    if (appIds.announcement) {
      try {
        const announcementClient = createAnnouncementClient();
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        const oneMonthLater = new Date(today);
        oneMonthLater.setMonth(today.getMonth() + 1);
        
        // 2025年12月21日（昨日）を設定
        const yesterday = new Date(2025, 11, 21); // 月は0始まりなので11が12月

        // 日付をyyyy-MM-dd形式に変換
        const formatDate = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const oneWeekAgoStr = formatDate(oneWeekAgo);
        const todayStr = formatDate(today);
        const yesterdayStr = formatDate(yesterday);
        const oneMonthLaterStr = formatDate(oneMonthLater);

        // 表示されるお知らせを4件作成（種別のバリエーションを含む）
        const announcementRecords = [
          // お知らせ1: 掲載開始日が作成当日、掲載終了日が1ヶ月後（表示される）
          {
            掲載種別: { value: "お知らせ" },
            掲載開始日: { value: todayStr },
            掲載終了日: { value: oneMonthLaterStr },
            通知内容: { value: "システムの新機能が追加されました。詳細はこちらをご確認ください。" },
          },
          // メンテナンス: 掲載開始日が作成当日、掲載終了日が1ヶ月後（表示される）
          {
            掲載種別: { value: "メンテナンス" },
            掲載開始日: { value: todayStr },
            掲載終了日: { value: oneMonthLaterStr },
            通知内容: { value: "来週のメンテナンス作業についてお知らせします。作業時間中はサービスが一時的に利用できなくなります。" },
          },
          // お知らせ2: 掲載開始日が作成当日、掲載終了日が1ヶ月後（表示される）
          {
            掲載種別: { value: "お知らせ" },
            掲載開始日: { value: todayStr },
            掲載終了日: { value: oneMonthLaterStr },
            通知内容: { value: "年末年始の営業時間についてお知らせします。12月29日から1月3日まで休業となります。" },
          },
          // 障害: 掲載開始日が作成当日、掲載終了日が1ヶ月後（表示される）
          {
            掲載種別: { value: "障害" },
            掲載開始日: { value: todayStr },
            掲載終了日: { value: oneMonthLaterStr },
            通知内容: { value: "現在、一部機能で不具合が発生している可能性があります。復旧作業を進めております。" },
          },
        ];

        // レコードを追加
        await announcementClient.record.addRecords({
          app: appIds.announcement,
          records: announcementRecords,
        });

        console.log(`   → ${announcementRecords.length}件を作成完了`);
      } catch (error) {
        console.log(`   → スキップ（App ID未設定またはエラー）`);
      }
    } else {
      console.log(`   → スキップ（App ID未設定）`);
    }

    // 完了メッセージ
    const totalRecommendationCount = allRecommendationRecords.length + yamadaRecommendationCount + hanakoRecommendationCount;

    console.log("\n🎉 シードデータの作成が完了しました！");
    console.log(`   ユーザー: ${seedData.authUsers.length}人, 人材: ${seedData.talents.length}人, 案件: ${seedData.jobs.length}件`);
    console.log(`   応募: ${seedData.applications.length}件, 推薦: ${totalRecommendationCount}件`);
    console.log(`\n📝 ログイン: seed_yamada@example.com / password123`);
    console.log(`            seed_hanako@example.com / password123\n`);

  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
      console.error("スタックトレース:", error.stack);
    }
    process.exit(1);
  }
};

// シードデータ削除
export const deleteSeedData = async () => {
  console.log("\n🗑️  シードデータを削除します...\n");

  try {
    const appIds = getAppIds();
    const talentClient = createTalentClient();
    const jobClient = createJobClient();
    const applicationClient = createApplicationClient();

    // 削除件数を記録
    let deletedCounts = { recommendation: 0, application: 0, job: 0, talent: 0, announcement: 0, user: 0 };

    // 推薦DBのクライアント（存在する場合のみ）
    let recommendationClient: ReturnType<typeof createRecommendationClient> | null = null;
    if (appIds.recommendation) {
      try {
        recommendationClient = createRecommendationClient();
      } catch {
        // スキップ
      }
    }

    // 1. 推薦データを全件削除
    if (recommendationClient && appIds.recommendation) {
      const recommendations = await recommendationClient.record.getAllRecords({
        app: appIds.recommendation,
        fields: ["$id"],
      });
      if (recommendations.length > 0) {
        const recIds = recommendations.map((record: any) => record.$id.value);
        for (let i = 0; i < recIds.length; i += 100) {
          const batch = recIds.slice(i, i + 100);
          await recommendationClient.record.deleteRecords({
            app: appIds.recommendation,
            ids: batch,
          });
        }
        deletedCounts.recommendation = recIds.length;
      }
    }

    // 2. 応募履歴を全件削除
    const applications = await applicationClient.record.getAllRecords({
      app: appIds.application,
      fields: ["$id"],
    });
    if (applications.length > 0) {
      const applicationIds = applications.map((record: any) => record.$id.value);
      for (let i = 0; i < applicationIds.length; i += 100) {
        const batch = applicationIds.slice(i, i + 100);
        await applicationClient.record.deleteRecords({
          app: appIds.application,
          ids: batch,
        });
      }
      deletedCounts.application = applicationIds.length;
    }

    // 3. 案件を全件削除
    const jobs = await jobClient.record.getAllRecords({
      app: appIds.job,
      fields: ["$id"],
    });
    if (jobs.length > 0) {
      const jobIds = jobs.map((record: any) => record.$id.value);
      for (let i = 0; i < jobIds.length; i += 100) {
        const batch = jobIds.slice(i, i + 100);
        await jobClient.record.deleteRecords({
          app: appIds.job,
          ids: batch,
        });
      }
      deletedCounts.job = jobIds.length;
    }

    // 4. 人材を全件削除
    const talents = await talentClient.record.getAllRecords({
      app: appIds.talent,
      fields: ["$id"],
    });
    if (talents.length > 0) {
      const talentIds = talents.map((record: any) => record.$id.value);
      for (let i = 0; i < talentIds.length; i += 100) {
        const batch = talentIds.slice(i, i + 100);
        await talentClient.record.deleteRecords({
          app: appIds.talent,
          ids: batch,
        });
      }
      deletedCounts.talent = talentIds.length;
    }

    // 5. システム通知を全件削除
    if (appIds.announcement) {
      try {
        const announcementClient = createAnnouncementClient();
        const announcements = await announcementClient.record.getAllRecords({
          app: appIds.announcement,
          fields: ["$id"],
        });
        if (announcements.length > 0) {
          const announcementIds = announcements.map((record: any) => record.$id.value);
          for (let i = 0; i < announcementIds.length; i += 100) {
            const batch = announcementIds.slice(i, i + 100);
            await announcementClient.record.deleteRecords({
              app: appIds.announcement,
              ids: batch,
            });
          }
          deletedCounts.announcement = announcementIds.length;
        }
      } catch {
        // スキップ
      }
    }

    // 6. Better Authユーザーを削除
    const db = getDb();
    const users = await db.select({ id: schema.user.id }).from(schema.user);
    const userCount = users.length;

    if (userCount > 0) {
      await db.delete(schema.session);
      await db.delete(schema.account);
      await db.delete(schema.verification);
      await db.delete(schema.user);
      deletedCounts.user = userCount;
    }

    await closePool();

    // サマリー表示
    console.log("🎉 シードデータの削除が完了しました！");
    console.log(`   推薦: ${deletedCounts.recommendation}件, 応募: ${deletedCounts.application}件, 案件: ${deletedCounts.job}件`);
    console.log(`   人材: ${deletedCounts.talent}件, 通知: ${deletedCounts.announcement}件, ユーザー: ${deletedCounts.user}件\n`);

  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
    }
    process.exit(1);
  }
};

// ========================================
// yamada ユーザーの Upsert（更新 or 作成）
// Vercel 環境との整合性を保つため、auth_user_id を固定で使用
// ========================================
const YAMADA_AUTH_USER_ID = "seed_user_001";

const upsertYamadaSeedData = async () => {
  console.log("\n🔄 yamada シードデータを Upsert（更新 or 作成）します\n");
  console.log("📌 auth_user_id:", YAMADA_AUTH_USER_ID);
  console.log("📌 この ID は Vercel 環境と共有されます\n");

  try {
    const appIds = getAppIds();
    const talentClient = createTalentClient();
    const jobClient = createJobClient();
    const applicationClient = createApplicationClient();

    // ========================================
    // Step 0: 問い合わせ・退会DBのクリーンアップ & STフィールドのリセット
    // ========================================
    console.log("=".repeat(80));
    console.log("🧹 Step 0: 問い合わせ・退会DBのクリーンアップ & STフィールドのリセット");
    console.log("=".repeat(80));

    // 問い合わせDBの全レコード削除
    if (appIds.inquiry) {
      try {
        const inquiryClient = createInquiryClient();
        const inquiryRecords = await inquiryClient.record.getAllRecords({
          app: appIds.inquiry,
        });

        if (inquiryRecords.length > 0) {
          const recordIds = inquiryRecords.map((r: any) => r.$id.value);
          await inquiryClient.record.deleteRecords({
            app: appIds.inquiry,
            ids: recordIds.map((id: string) => parseInt(id, 10)),
          });
          console.log(`✅ 問い合わせ・退会DB: ${recordIds.length}件のレコードを削除しました`);
        } else {
          console.log("✅ 問い合わせ・退会DB: 削除するレコードはありません");
        }
      } catch (inquiryError) {
        console.error("⚠️ 問い合わせ・退会DBのクリーンアップに失敗:", inquiryError);
        // エラーが発生しても続行
      }
    } else {
      console.log("⚠️ 問い合わせ・退会DBのApp IDが設定されていません");
    }

    // Yamadaの人材DBレコードのSTフィールドをリセット
    try {
      const existingTalent = await talentClient.record.getAllRecords({
        app: appIds.talent,
        condition: `${TALENT_FIELDS.AUTH_USER_ID} = "${YAMADA_AUTH_USER_ID}"`,
      });

      if (existingTalent.length > 0) {
        const talentRecordId = (existingTalent[0] as any).$id.value;
        const currentST = (existingTalent[0] as any)[TALENT_FIELDS.ST]?.value || "";

        if (currentST === "退会") {
          await talentClient.record.updateRecord({
            app: appIds.talent,
            id: talentRecordId,
            record: {
              [TALENT_FIELDS.ST]: { value: "" }, // STフィールドを空にリセット
            },
          });
          console.log(`✅ 人材DB: Yamadaの退会ステータスをリセットしました`);
        } else {
          console.log(`✅ 人材DB: Yamadaは退会ステータスではありません（現在: "${currentST}"）`);
        }
      } else {
        console.log("⚠️ 人材DB: Yamadaのレコードが見つかりません（後で作成されます）");
      }
    } catch (talentError) {
      console.error("⚠️ 人材DBのSTフィールドリセットに失敗:", talentError);
      // エラーが発生しても続行
    }

    console.log("");

    const seedData = seedData1;

    // 1. Better Auth ユーザーの Upsert
    console.log("=".repeat(80));
    console.log("👤 Step 1: Better Auth ユーザーを Upsert");
    console.log("=".repeat(80));

    const db = getDb();

    try {
      // 既存ユーザーを確認（ID またはメールアドレスで検索）
      const existingUserById = await db.select().from(schema.user).where(eq(schema.user.id, YAMADA_AUTH_USER_ID)).then(rows => rows[0]);
      const existingUserByEmail = await db.select().from(schema.user).where(eq(schema.user.email, seedData.authUsers[0].email)).then(rows => rows[0]);

      if (existingUserById) {
        console.log(`✅ 既存ユーザーを確認（ID一致）: ${YAMADA_AUTH_USER_ID}`);
        // 更新（名前とメールアドレス）
        await db.update(schema.user)
          .set({
            name: seedData.authUsers[0].name,
            email: seedData.authUsers[0].email,
            updatedAt: new Date(),
          })
          .where(eq(schema.user.id, YAMADA_AUTH_USER_ID));
        console.log(`✅ ユーザー情報を更新しました`);
        
        // 既存のaccountレコードを確認してパスワードを更新
        const existingAccount = await db.select().from(schema.account).where(eq(schema.account.userId, YAMADA_AUTH_USER_ID)).then(rows => rows[0]);
        if (existingAccount) {
          // パスワードを再ハッシュ化して更新（Better Authの正しい形式を保証）
          const hashedPassword = await hashPasswordBetterAuth(seedData.authUsers[0].password);
          await db.update(schema.account)
            .set({
              password: hashedPassword,
              updatedAt: new Date(),
            })
            .where(eq(schema.account.userId, YAMADA_AUTH_USER_ID));
          console.log(`✅ パスワードを更新しました（Better Authの正しいハッシュ形式を使用）`);
        } else {
          // accountレコードが存在しない場合は作成
          const hashedPassword = await hashPasswordBetterAuth(seedData.authUsers[0].password);
          const accountId = generateId(32);
          await db.insert(schema.account).values({
            id: accountId,
            userId: YAMADA_AUTH_USER_ID,
            accountId: YAMADA_AUTH_USER_ID,
            providerId: "credential",
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log(`✅ accountレコードを作成しました`);
        }
      } else if (existingUserByEmail) {
        console.log(`⚠️ 同じメールアドレスで別のユーザーが存在: ${existingUserByEmail.id}`);
        console.log(`🔄 既存ユーザーを削除して、正しい ID で再作成します`);
        
        // 既存ユーザーを削除（外部キー制約の順番に注意）
        await db.delete(schema.session).where(eq(schema.session.userId, existingUserByEmail.id));
        await db.delete(schema.account).where(eq(schema.account.userId, existingUserByEmail.id));
        await db.delete(schema.user).where(eq(schema.user.id, existingUserByEmail.id));
        console.log(`✅ 既存ユーザーを削除しました`);

        // 新規作成
        const hashedPassword = await hashPasswordBetterAuth(seedData.authUsers[0].password);
        const now = new Date();
        const accountId = generateId(32);

        await db.insert(schema.user).values({
          id: YAMADA_AUTH_USER_ID,
          name: seedData.authUsers[0].name,
          email: seedData.authUsers[0].email,
          emailVerified: true,
          image: null,
          createdAt: now,
          updatedAt: now,
        });

        await db.insert(schema.account).values({
          id: accountId,
          userId: YAMADA_AUTH_USER_ID,
          accountId: YAMADA_AUTH_USER_ID,
          providerId: "credential",
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        });
        console.log(`✅ 正しい ID でユーザーを再作成しました`);
      } else {
        console.log(`📝 新規ユーザーを作成: ${YAMADA_AUTH_USER_ID}`);
        // 新規作成
        const hashedPassword = await hashPasswordBetterAuth(seedData.authUsers[0].password);
        const now = new Date();
        const accountId = generateId(32);

        await db.insert(schema.user).values({
          id: YAMADA_AUTH_USER_ID,
          name: seedData.authUsers[0].name,
          email: seedData.authUsers[0].email,
          emailVerified: true,
          image: null,
          createdAt: now,
          updatedAt: now,
        });

        await db.insert(schema.account).values({
          id: accountId,
          userId: YAMADA_AUTH_USER_ID,
          accountId: YAMADA_AUTH_USER_ID,
          providerId: "credential",
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        });
        console.log(`✅ 新規ユーザーを作成しました`);
      }
    } catch (error) {
      console.error("ユーザー Upsert エラー:", error);
      throw error;
    }

    // 2. 人材DB の Upsert
    console.log("\n" + "=".repeat(80));
    console.log("👨‍💼 Step 2: 人材DBを Upsert");
    console.log("=".repeat(80));

    // auth_user_id で既存レコードを検索
    const existingTalents = await talentClient.record.getAllRecords({
      app: appIds.talent,
      condition: `${TALENT_FIELDS.AUTH_USER_ID} = "${YAMADA_AUTH_USER_ID}"`,
    });

    const talent = seedData.talents[0];
    const talentRecord = {
      [TALENT_FIELDS.AUTH_USER_ID]: { value: YAMADA_AUTH_USER_ID },
      [TALENT_FIELDS.LAST_NAME]: { value: talent.姓 },
      [TALENT_FIELDS.FIRST_NAME]: { value: talent.名 },
      [TALENT_FIELDS.FULL_NAME]: { value: talent.氏名 },
      [TALENT_FIELDS.LAST_NAME_KANA]: { value: talent.セイ },
      [TALENT_FIELDS.FIRST_NAME_KANA]: { value: talent.メイ },
      [TALENT_FIELDS.EMAIL]: { value: talent.メールアドレス },
      [TALENT_FIELDS.PHONE]: { value: talent.電話番号 },
      [TALENT_FIELDS.BIRTH_DATE]: { value: talent.生年月日 },
      [TALENT_FIELDS.POSTAL_CODE]: { value: talent.郵便番号 },
      [TALENT_FIELDS.ADDRESS]: { value: talent.住所 },
      [TALENT_FIELDS.SKILLS]: { value: talent.言語_ツール },
      [TALENT_FIELDS.EXPERIENCE]: { value: talent.主な実績_PR_職務経歴 },
      [TALENT_FIELDS.PORTFOLIO_URL]: { value: talent.ポートフォリオリンク },
      [TALENT_FIELDS.AVAILABLE_FROM]: { value: talent.稼働可能時期 },
      [TALENT_FIELDS.DESIRED_RATE]: { value: talent.希望単価_月額 },
      [TALENT_FIELDS.DESIRED_WORK_DAYS]: { value: talent.希望勤務日数 },
      [TALENT_FIELDS.DESIRED_COMMUTE]: { value: talent.希望出社頻度 },
      [TALENT_FIELDS.DESIRED_WORK_STYLE]: { value: talent.希望勤務スタイル },
      [TALENT_FIELDS.DESIRED_WORK]: { value: talent.希望案件_作業内容 },
      [TALENT_FIELDS.NG_COMPANIES]: { value: talent.NG企業 },
      [TALENT_FIELDS.OTHER_REQUESTS]: { value: talent.その他要望 },
    };

    let talentRecordId: string;

    if (existingTalents.length > 0) {
      // 更新
      const existingId = (existingTalents[0] as any).$id.value;
      await talentClient.record.updateRecord({
        app: appIds.talent,
        id: existingId,
        record: talentRecord,
      });
      talentRecordId = existingId;
      console.log(`✅ 既存の人材レコードを更新: ID=${existingId}`);
    } else {
      // 新規作成
      const result = await talentClient.record.addRecord({
        app: appIds.talent,
        record: talentRecord,
      });
      talentRecordId = result.id;
      console.log(`✅ 新規人材レコードを作成: ID=${result.id}`);
    }

    // 3. 案件DB の Upsert（案件名で識別）
    console.log("\n" + "=".repeat(80));
    console.log("💼 Step 3: 案件DBを Upsert");
    console.log("=".repeat(80));

    const jobIds: string[] = [];

    for (const job of seedData.jobs) {
      // 案件名で既存レコードを検索
      const existingJobs = await jobClient.record.getAllRecords({
        app: appIds.job,
        condition: `案件名 = "${job.案件名}"`,
      });

      const jobRecord = {
        案件名: { value: job.案件名 },
        職種_ポジション: { value: job.職種_ポジション },
        スキル: { value: job.スキル },
        概要: { value: job.概要 },
        環境: { value: job.環境 },
        必須スキル: { value: job.必須スキル },
        尚可スキル: { value: job.尚可スキル },
        勤務地エリア: { value: job.勤務地エリア },
        最寄駅: { value: job.最寄駅 },
        下限h: { value: job.下限h },
        上限h: { value: job.上限h },
        掲載単価: { value: job.掲載単価 },
        数値_0: { value: job.MAX単価 },
        案件期間: { value: job.案件期間 },
        日付: { value: job.参画時期 },
        面談回数: { value: job.面談回数 },
        案件特徴: { value: job.案件特徴 },
        ラジオボタン: { value: job.ラジオボタン },
        ラジオボタン_0: { value: job.ラジオボタン_0 },
        商流: { value: job.商流 },
        契約形態: { value: job.契約形態 },
        リモート可否: { value: job.リモート可否 },
        外国籍: { value: job.外国籍 },
        数値: { value: job.募集人数 },
      };

      if (existingJobs.records.length > 0) {
        // 更新
        const existingId = (existingJobs.records[0] as any).$id.value;
        await jobClient.record.updateRecord({
          app: appIds.job,
          id: existingId,
          record: jobRecord,
        });
        jobIds.push(existingId);
        console.log(`✅ 既存の案件を更新: ${job.案件名} (ID=${existingId})`);
      } else {
        // 新規作成
        const result = await jobClient.record.addRecord({
          app: appIds.job,
          record: jobRecord,
        });
        jobIds.push(result.id);
        console.log(`✅ 新規案件を作成: ${job.案件名} (ID=${result.id})`);
      }
    }

    // 4. 応募履歴DB の Upsert（auth_user_id + job_id で識別）
    console.log("\n" + "=".repeat(80));
    console.log("📝 Step 4: 応募履歴DBを Upsert");
    console.log("=".repeat(80));

    for (const application of seedData.applications) {
      const jobId = jobIds[application.jobIndex];

      // auth_user_id と job_id で既存レコードを検索
      const existingApplications = await applicationClient.record.getAllRecords({
        app: appIds.application,
        condition: `${APPLICATION_FIELDS.AUTH_USER_ID} = "${YAMADA_AUTH_USER_ID}" and ${APPLICATION_FIELDS.JOB_ID} = "${jobId}"`,
      });

      const applicationRecord: any = {
        [APPLICATION_FIELDS.AUTH_USER_ID]: { value: YAMADA_AUTH_USER_ID },
        [APPLICATION_FIELDS.JOB_ID]: { value: jobId },
        [APPLICATION_FIELDS.STATUS]: { value: application.対応状況 },
      };

      // 作成日時_開発環境が指定されている場合は追加
      if ((application as any).作成日時_開発環境) {
        applicationRecord[APPLICATION_FIELDS.CREATED_AT_DEV] = { value: (application as any).作成日時_開発環境 };
      }

      if (existingApplications.length > 0) {
        // 更新
        const existingId = (existingApplications[0] as any).$id.value;
        await applicationClient.record.updateRecord({
          app: appIds.application,
          id: existingId,
          record: applicationRecord,
        });
        console.log(`✅ 既存の応募履歴を更新: 案件ID=${jobId} (ID=${existingId})`);
      } else {
        // 新規作成
        const result = await applicationClient.record.addRecord({
          app: appIds.application,
          record: applicationRecord,
        });
        console.log(`✅ 新規応募履歴を作成: 案件ID=${jobId} (ID=${result.id})`);
      }
    }

    // 5. 推薦DB の Upsert（人材ID + 案件ID で識別）
    console.log("\n" + "=".repeat(80));
    console.log("⭐ Step 5: 推薦DBを Upsert（表示順確認用）");
    console.log("=".repeat(80));

    const recommendationClient = createRecommendationClient();
    
    // 応募済み案件の推薦データ（案件一覧には表示されない）
    for (const recommendation of seedData.recommendations) {
      const jobId = jobIds[recommendation.jobIndex];

      // 人材ID と 案件ID で既存レコードを検索
      const existingRecommendations = await recommendationClient.record.getAllRecords({
        app: appIds.recommendation,
        condition: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${YAMADA_AUTH_USER_ID}" and ${RECOMMENDATION_FIELDS.JOB_ID} = "${jobId}"`,
      });

      const recommendationRecord: any = {
        [RECOMMENDATION_FIELDS.TALENT_ID]: { value: YAMADA_AUTH_USER_ID },
        [RECOMMENDATION_FIELDS.JOB_ID]: { value: jobId },
        [RECOMMENDATION_FIELDS.SCORE]: { value: recommendation.score.toString() },
      };

      if (existingRecommendations.length > 0) {
        // 更新
        const existingId = (existingRecommendations[0] as any).$id.value;
        await recommendationClient.record.updateRecord({
          app: appIds.recommendation,
          id: existingId,
          record: recommendationRecord,
        });
        console.log(`✅ 既存の推薦レコードを更新: 案件ID=${jobId}, スコア=${recommendation.score} (ID=${existingId})`);
      } else {
        // 新規作成
        const result = await recommendationClient.record.addRecord({
          app: appIds.recommendation,
          record: recommendationRecord,
        });
        console.log(`✅ 新規推薦レコードを作成: 案件ID=${jobId}, スコア=${recommendation.score} (ID=${result.id})`);
      }
    }

    // 案件一覧に表示される案件の推薦データ（担当者おすすめ・AIマッチフラグ付き）
    if (seedData1.recommendationsForYamada && seedData1.recommendationsForYamada.length > 0) {
      for (const recommendation of seedData1.recommendationsForYamada) {
        // jobIndexが統合後の全案件の範囲内かチェック
        if (recommendation.jobIndex >= jobIds.length) {
          console.log(`⚠️ jobIndex ${recommendation.jobIndex} は範囲外です（案件数: ${jobIds.length}）`);
          continue;
        }
        const jobId = jobIds[recommendation.jobIndex];

        // 人材ID と 案件ID で既存レコードを検索
        const existingRecommendations = await recommendationClient.record.getAllRecords({
          app: appIds.recommendation,
          condition: `${RECOMMENDATION_FIELDS.TALENT_ID} = "${YAMADA_AUTH_USER_ID}" and ${RECOMMENDATION_FIELDS.JOB_ID} = "${jobId}"`,
        });

        const recommendationRecord: any = {
          [RECOMMENDATION_FIELDS.TALENT_ID]: { value: YAMADA_AUTH_USER_ID },
          [RECOMMENDATION_FIELDS.JOB_ID]: { value: jobId },
          [RECOMMENDATION_FIELDS.SCORE]: { value: recommendation.score.toString() },
        };

        // 担当者おすすめフラグ
        if (recommendation.staffRecommend) {
          recommendationRecord[RECOMMENDATION_FIELDS.STAFF_RECOMMEND] = { value: "おすすめ" };
        }

        // AIマッチフラグ
        if (recommendation.aiMatched) {
          recommendationRecord[RECOMMENDATION_FIELDS.AI_EXECUTION_STATUS] = { value: "実行済み" };
          // AIスコアをダミーで設定
          recommendationRecord[RECOMMENDATION_FIELDS.AI_OVERALL_SCORE] = { value: "85" };
          recommendationRecord[RECOMMENDATION_FIELDS.AI_SKILL_SCORE] = { value: "90" };
          recommendationRecord[RECOMMENDATION_FIELDS.AI_PROCESS_SCORE] = { value: "85" };
          recommendationRecord[RECOMMENDATION_FIELDS.AI_INFRA_SCORE] = { value: "80" };
          recommendationRecord[RECOMMENDATION_FIELDS.AI_DOMAIN_SCORE] = { value: "75" };
          recommendationRecord[RECOMMENDATION_FIELDS.AI_TEAM_SCORE] = { value: "90" };
          recommendationRecord[RECOMMENDATION_FIELDS.AI_TOOL_SCORE] = { value: "85" };
          recommendationRecord[RECOMMENDATION_FIELDS.AI_RESULT] = { value: "この案件は候補者のスキルセットと非常にマッチしています。" };
          recommendationRecord[RECOMMENDATION_FIELDS.AI_EXECUTED_AT] = { value: new Date().toISOString() };
        }

        if (existingRecommendations.length > 0) {
          // 更新
          const existingId = (existingRecommendations[0] as any).$id.value;
          await recommendationClient.record.updateRecord({
            app: appIds.recommendation,
            id: existingId,
            record: recommendationRecord,
          });
          const flags = [];
          if (recommendation.staffRecommend) flags.push("担当者おすすめ");
          if (recommendation.aiMatched) flags.push("AIマッチ");
          console.log(`✅ 既存の推薦レコードを更新: 案件ID=${jobId}, スコア=${recommendation.score}${flags.length > 0 ? `, ${flags.join(" + ")}` : ""} (ID=${existingId})`);
        } else {
          // 新規作成
          const result = await recommendationClient.record.addRecord({
            app: appIds.recommendation,
            record: recommendationRecord,
          });
          const flags = [];
          if (recommendation.staffRecommend) flags.push("担当者おすすめ");
          if (recommendation.aiMatched) flags.push("AIマッチ");
          console.log(`✅ 新規推薦レコードを作成: 案件ID=${jobId}, スコア=${recommendation.score}${flags.length > 0 ? `, ${flags.join(" + ")}` : ""} (ID=${result.id})`);
        }
      }
    }

    // 完了メッセージ
    console.log("\n" + "=".repeat(80));
    console.log("🎉 yamada シードデータの Upsert が完了しました！");
    console.log("=".repeat(80));
    console.log("\n📊 処理されたデータ:");
    console.log(`  👤 Better Authユーザー: 1件`);
    console.log(`  👨‍💼 人材: 1件`);
    console.log(`  💼 案件: ${seedData.jobs.length}件`);
    console.log(`  📝 応募履歴: ${seedData.applications.length}件`);
    console.log(`  ⭐ 推薦データ: ${seedData.recommendations.length}件`);

    console.log("\n📝 ログイン情報:");
    console.log(`  - 山田 太郎: seed_yamada@example.com / password123`);
    console.log(`  - auth_user_id: ${YAMADA_AUTH_USER_ID}`);

    console.log("\n📋 応募済み案件のステータス:");
    console.log("  ※ seed_yamada@example.com でログインすると応募済み案件一覧に以下が表示されます:");
    console.log("  - jobIndex 0: 応募済み（大手ECサイトのフロントエンド刷新案件）");
    console.log("  - jobIndex 1: 面談調整中（金融系WebアプリケーションAPI開発）");
    console.log("  - jobIndex 2: 面談予定（スタートアップ向け新規サービス開発）");
    console.log("  - jobIndex 3: 案件決定（ヘルスケアアプリ開発案件）");
    console.log("  - jobIndex 4: 募集終了（データ基盤構築・運用案件）");
    console.log("  ※ 各ステータスが1件ずつ表示されます");

    console.log("\n💡 Vercel 環境でも同じ auth_user_id でログインできます");
    console.log("\n");

  } catch (error) {
    console.error("\n❌ エラーが発生しました:", error);
    if (error instanceof Error) {
      console.error("エラーメッセージ:", error.message);
      console.error("スタックトレース:", error.stack);
    }
    process.exit(1);
  }
};

// --dual オプションがあるかチェック
const isDualMode = process.argv.includes("--dual");

// 認証ユーザーのみを特定のDBに作成する関数
const createAuthUsersOnly = async (targetDb: "local" | "rds") => {
  await switchDatabase(targetDb);
  const db = getDb();

  console.log(`\n📦 ${targetDb === "local" ? "ローカルDB" : "AWS RDS"} に認証ユーザーを作成します...`);

  // シードデータの認証ユーザーを取得（セット1+セット2の全ユーザー）
  const allAuthUsers = [
    ...seedData1.authUsers,
    ...seedData2.authUsers,
  ];

  for (const userData of allAuthUsers) {
    try {
      // 既存ユーザーをチェック
      const existingUser = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, userData.email))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`⏭️  ユーザー ${userData.email} は既に存在します（${targetDb}）`);
        continue;
      }

      // パスワードハッシュを生成
      const hashedPassword = await hashPasswordBetterAuth(userData.password);

      // ユーザーを作成
      await db.insert(schema.user).values({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: true,
        image: userData.image,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // アカウントを作成
      await db.insert(schema.account).values({
        id: generateId(),
        accountId: userData.id,
        providerId: "credential",
        userId: userData.id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ ユーザー作成成功: ${userData.email}（${targetDb}）`);
    } catch (error: any) {
      console.error(`❌ ユーザー作成エラー（${userData.email}）:`, error.message);
    }
  }
};

// Dual モード: 両環境に認証ユーザーを作成してからKintoneデータを作成
const createSeedDataDual = async () => {
  console.log("🔄 Dual モード: ローカルDB と AWS RDS の両方にシードデータを作成します\n");

  // DATABASE_URL がないとRDSに接続できない
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL が設定されていません。RDSへの接続ができません。");
    console.error("   .env.local に DATABASE_URL を設定してください。");
    process.exit(1);
  }

  // 1. ローカルDBに認証ユーザーを作成
  await createAuthUsersOnly("local");

  // 2. AWS RDSに認証ユーザーを作成
  await createAuthUsersOnly("rds");

  // 3. Kintoneデータは共有なので1回だけ作成（USE_LOCAL_DBの設定に関係なく動作）
  console.log("\n📦 Kintone にタレント・案件データを作成します...");

  // 元のcreateを呼ぶと認証ユーザーも作ろうとするので、Kintoneデータのみ作成するフラグを設定
  process.env.SEED_KINTONE_ONLY = "true";
  await createSeedData();
  delete process.env.SEED_KINTONE_ONLY;

  await closePool();
  console.log("\n✅ Dual モード完了: 両環境でシードユーザーが使用可能です");
  console.log("   ログイン: seed_yamada@example.com / password123");
};

// コマンドライン引数で処理を分岐
const command = process.argv[2];

if (command === "create") {
  if (isDualMode) {
    createSeedDataDual();
  } else {
    createSeedData();
  }
} else if (command === "delete") {
  deleteSeedData();
} else if (command === "upsert") {
  upsertYamadaSeedData();
} else if (command === "create:1") {
  // seed:create:1 用（引数なしでcreate呼び出し時のため）
  process.argv[3] = "1";
  if (isDualMode) {
    createSeedDataDual();
  } else {
    createSeedData();
  }
} else if (command === "create:2") {
  process.argv[3] = "2";
  if (isDualMode) {
    createSeedDataDual();
  } else {
    createSeedData();
  }
} else if (command === "create:3") {
  process.argv[3] = "3";
  createSeedData();
} else {
  console.error("使用方法:");
  console.error("  npm run seed:create            - シードデータを作成（デフォルト: セット2）");
  console.error("  npm run seed:create -- --dual  - 両環境（ローカル+AWS）にシードを作成");
  console.error("  npm run seed:create:1          - セット1を作成（削除 + 作成）");
  console.error("  npm run seed:create:2          - セット2を作成（削除 + 作成）");
  console.error("  npm run seed:create:3          - セット3を作成（50人+50案件）");
  console.error("  npm run seed:upsert            - yamada シードデータを Upsert（Vercel 連携用）");
  console.error("  npm run seed:delete            - シードデータを全件削除");
  process.exit(1);
}
