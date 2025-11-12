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

import { createTalentClient, createJobClient, createApplicationClient, getAppIds } from "../lib/kintone/client";
import { uploadFileToKintone } from "../lib/kintone/services/file";
import { TALENT_FIELDS, JOB_FIELDS, APPLICATION_FIELDS } from "../lib/kintone/fieldMapping";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../lib/db/schema";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "auth.db");

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

// シードデータの定義
export const seedData = {
  // Better Auth ユーザー (1人)
  authUser: {
    id: "seed_user_001",
    name: "山田 太郎",
    email: "seed_yamada@example.com",
    password: "password123", // ハッシュ化が必要
    emailVerified: false,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // 人材DB (1人)
  talent: {
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

  // 案件DB (5件)
  jobs: [
    {
      案件名: "大手ECサイトのフロントエンド刷新案件",
      ルックアップ: "株式会社サンプル商事",
      職種_ポジション: ["開発"],
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
      リモート: "可",
      外国籍: "可",
      募集人数: 2,
    },
    {
      案件名: "金融系Webアプリケーション開発",
      ルックアップ: "○○銀行",
      職種_ポジション: ["開発"],
      概要: `金融機関向けのWebアプリケーション開発案件です。
フルスタックエンジニアとして、フロントエンドとバックエンドの両方を担当していただきます。
セキュリティ要件が高く、堅牢なシステム開発の経験がある方を歓迎します。`,
      環境: `【開発環境】
・フロントエンド: React, TypeScript
・バックエンド: Java, Spring Boot
・DB: PostgreSQL
・インフラ: オンプレミス
・その他: GitLab, Jenkins`,
      必須スキル: `・React + TypeScriptでの開発経験 1年以上
・Java + Spring Bootでの開発経験 2年以上
・RDBMSの設計・実装経験
・セキュアコーディングの知識`,
      尚可スキル: `・金融系システムの開発経験
・マイクロサービスアーキテクチャの経験
・CI/CDパイプラインの構築経験`,
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
      リモート: "条件付き可",
      外国籍: "不可",
      募集人数: 1,
    },
    {
      案件名: "スタートアップ向け新規サービス開発",
      ルックアップ: "株式会社テックベンチャー",
      職種_ポジション: ["開発"],
      概要: `急成長中のスタートアップ企業で、新規Webサービスの立ち上げメンバーを募集します。
技術選定から携わることができ、裁量を持って開発を進められる環境です。
スピード感を持って開発できる方を歓迎します。`,
      環境: `【開発環境】
・フロントエンド: Next.js, TypeScript, TailwindCSS
・バックエンド: Node.js, NestJS
・DB: MongoDB
・インフラ: AWS (ECS, RDS, S3)
・その他: GitHub, CircleCI`,
      必須スキル: `・Next.jsでの開発経験
・TypeScriptの実務経験
・REST APIの設計・実装経験
・AWSを使った開発経験`,
      尚可スキル: `・スタートアップでの開発経験
・0→1のサービス立ち上げ経験
・技術選定やアーキテクチャ設計の経験
・NoSQLデータベースの使用経験`,
      勤務地エリア: "東京都港区",
      最寄駅: "六本木駅",
      下限h: 140,
      上限h: 180,
      掲載単価: 70,
      MAX単価: 75,
      案件期間: "3ヶ月〜",
      参画時期: "2025-12-15",
      面談回数: "1回",
      案件特徴: ["スタートアップ", "新規開発案件", "フルリモート可", "最新技術導入", "服装自由", "面談1回"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "直",
      契約形態: "業務委託",
      リモート: "可",
      外国籍: "可",
      募集人数: 3,
    },
    {
      案件名: "社内システムのリプレイス案件",
      ルックアップ: "大手製造業A社",
      職種_ポジション: ["開発", "社内SE"],
      概要: `大手製造業の社内管理システムのリプレイス案件です。
レガシーなシステムをモダンな技術スタックで刷新します。
業務システムの開発経験がある方を優先的に採用します。`,
      環境: `【開発環境】
・フロントエンド: React, Material-UI
・バックエンド: Python, FastAPI
・DB: PostgreSQL
・インフラ: オンプレミス
・その他: GitLab`,
      必須スキル: `・React + TypeScriptでの開発経験
・Python（Django or FastAPI）での開発経験
・業務システムの開発経験
・要件定義〜設計の経験`,
      尚可スキル: `・製造業システムの経験
・ERPシステムの知識
・プロジェクトマネジメント経験`,
      勤務地エリア: "神奈川県横浜市",
      最寄駅: "横浜駅",
      下限h: 160,
      上限h: 180,
      掲載単価: 65,
      MAX単価: 70,
      案件期間: "12ヶ月〜",
      参画時期: "2026-02-01",
      面談回数: "2回",
      案件特徴: ["安定稼働", "長期案件", "上流工程参画", "週3日～OK"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "元請け",
      契約形態: "準委任",
      リモート: "条件付き可",
      外国籍: "条件付き可",
      募集人数: 2,
    },
    {
      案件名: "官公庁向けポータルサイト開発",
      ルックアップ: "○○省",
      職種_ポジション: ["開発"],
      概要: `官公庁向けのポータルサイト開発案件です。
アクセシビリティやセキュリティに配慮した開発が求められます。
公共系システムの開発経験がある方を優遇します。`,
      環境: `【開発環境】
・フロントエンド: React, TypeScript
・バックエンド: Java, Spring Boot
・DB: Oracle
・インフラ: オンプレミス`,
      必須スキル: `・React + TypeScriptでの開発経験
・Java + Spring Bootでの開発経験
・アクセシビリティ対応の経験
・セキュアコーディングの知識`,
      尚可スキル: `・官公庁案件の経験
・大規模システムの開発経験
・JIS X 8341-3への対応経験`,
      勤務地エリア: "東京都港区",
      最寄駅: "霞ヶ関駅",
      下限h: 160,
      上限h: 180,
      掲載単価: 72,
      MAX単価: 77,
      案件期間: "12ヶ月〜",
      参画時期: "2026-03-01",
      面談回数: "3回",
      案件特徴: ["安定稼働", "長期案件", "官公庁関連", "常駐案件"],
      ラジオボタン: "募集中",
      ラジオボタン_0: "有",
      商流: "元請け",
      契約形態: "準委任",
      リモート: "不可",
      外国籍: "不可",
      募集人数: 1,
    },
  ],

  // 応募履歴 (2件)
  // ※案件IDは実行時に動的に設定されます
  applications: [
    {
      auth_user_id: "seed_user_001",
      案件ID: 0, // 動的に設定（大手ECサイトのフロントエンド刷新案件）
      対応状況: "面談調整中",
    },
    {
      auth_user_id: "seed_user_001",
      案件ID: 2, // 動的に設定（スタートアップ向け新規サービス開発）
      対応状況: "応募済み",
    },
  ],
};

// シードデータ作成
export const createSeedData = async () => {
  console.log("\n🌱 シードデータを作成します\n");

  try {
    const appIds = getAppIds();
    const talentClient = createTalentClient();
    const jobClient = createJobClient();
    const applicationClient = createApplicationClient();

    // 1. Better Authユーザーを作成
    console.log("=" .repeat(80));
    console.log("👤 Step 1: Better Authユーザーを作成");
    console.log("=" .repeat(80));

    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema });

    // 既存のユーザーをチェック
    const existingUser = await db.query.user.findFirst({
      where: (users, { eq }) => eq(users.email, seedData.authUser.email),
    });

    let authUserId = seedData.authUser.id;

    if (existingUser) {
      console.log(`⚠️  ユーザー ${seedData.authUser.email} は既に存在します。スキップします。`);
      authUserId = existingUser.id;
      sqlite.close();
    } else {
      sqlite.close();
      
      // Better AuthのAPIを使ってユーザーを作成（メール認証なしで）
      const signUpResponse = await fetch("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: seedData.authUser.email,
          password: seedData.authUser.password,
          name: seedData.authUser.name,
        }),
      });

      if (!signUpResponse.ok) {
        const error = await signUpResponse.json();
        throw new Error(`Better Auth登録失敗: ${JSON.stringify(error)}`);
      }

      const authData = await signUpResponse.json();
      authUserId = authData.user.id;

      // シードデータ用にメール認証済みの状態に更新
      const sqlite2 = new Database(dbPath);
      try {
        sqlite2.prepare("UPDATE user SET emailVerified = 1 WHERE id = ?").run(authUserId);
        console.log(`✅ ユーザー作成: ${seedData.authUser.email} (ID: ${authUserId}) - メール認証済み`);
      } finally {
        sqlite2.close();
      }
    }

    // 2. ダミーファイルをアップロード
    console.log("\n" + "=" .repeat(80));
    console.log("📄 Step 2: ダミーファイルをアップロード");
    console.log("=" .repeat(80));

    let uploadedFiles: Array<{ fileKey: string; name: string; size: string }> = [];
    try {
      uploadedFiles = await uploadDummyFiles();
      console.log(`✅ ダミーファイルアップロード完了: ${uploadedFiles.length}件`);
    } catch (fileError) {
      console.log(`⚠️ ダミーファイルアップロードをスキップしました (今回はファイルなしで続行)`);
      uploadedFiles = [];
    }

    // 3. 人材DBにレコード作成（ファイル情報を含む）
    console.log("\n" + "=" .repeat(80));
    console.log("👨‍💼 Step 3: 人材DBにレコードを作成");
    console.log("=" .repeat(80));

    const talentRecord = await talentClient.record.addRecord({
      app: appIds.talent,
      record: {
        [TALENT_FIELDS.AUTH_USER_ID]: { value: authUserId },
        [TALENT_FIELDS.LAST_NAME]: { value: seedData.talent.姓 },
        [TALENT_FIELDS.FIRST_NAME]: { value: seedData.talent.名 },
        [TALENT_FIELDS.FULL_NAME]: { value: seedData.talent.氏名 },
        [TALENT_FIELDS.LAST_NAME_KANA]: { value: seedData.talent.セイ },
        [TALENT_FIELDS.FIRST_NAME_KANA]: { value: seedData.talent.メイ },
        [TALENT_FIELDS.EMAIL]: { value: seedData.talent.メールアドレス },
        [TALENT_FIELDS.PHONE]: { value: seedData.talent.電話番号 },
        [TALENT_FIELDS.BIRTH_DATE]: { value: seedData.talent.生年月日 },
        [TALENT_FIELDS.POSTAL_CODE]: { value: seedData.talent.郵便番号 },
        [TALENT_FIELDS.ADDRESS]: { value: seedData.talent.住所 },
        [TALENT_FIELDS.SKILLS]: { value: seedData.talent.言語_ツール },
        [TALENT_FIELDS.EXPERIENCE]: { value: seedData.talent.主な実績_PR_職務経歴 },
        [TALENT_FIELDS.RESUME_FILES]: { value: uploadedFiles },
        [TALENT_FIELDS.PORTFOLIO_URL]: { value: seedData.talent.ポートフォリオリンク },
        [TALENT_FIELDS.AVAILABLE_FROM]: { value: seedData.talent.稼働可能時期 },
        [TALENT_FIELDS.DESIRED_RATE]: { value: seedData.talent.希望単価_月額 },
        [TALENT_FIELDS.DESIRED_WORK_DAYS]: { value: seedData.talent.希望勤務日数 },
        [TALENT_FIELDS.DESIRED_COMMUTE]: { value: seedData.talent.希望出社頻度 },
        [TALENT_FIELDS.DESIRED_WORK_STYLE]: { value: seedData.talent.希望勤務スタイル },
        [TALENT_FIELDS.DESIRED_WORK]: { value: seedData.talent.希望案件_作業内容 },
        [TALENT_FIELDS.NG_COMPANIES]: { value: seedData.talent.NG企業 },
        [TALENT_FIELDS.OTHER_REQUESTS]: { value: seedData.talent.その他要望 },
      },
    });

    console.log(`✅ 人材レコード作成: ${seedData.talent.氏名} (ID: ${talentRecord.id})`);

    // 4. 案件DBにレコード作成
    console.log("\n" + "=" .repeat(80));
    console.log("💼 Step 4: 案件DBにレコードを作成");
    console.log("=" .repeat(80));

    const jobIds: string[] = [];

    for (const job of seedData.jobs) {
      const jobRecord = await jobClient.record.addRecord({
        app: appIds.job,
        record: {
          案件名: { value: job.案件名 },
          // ルックアップ: { value: job.ルックアップ }, // ルックアップは省略（自動設定される場合がある）
          職種_ポジション: { value: job.職種_ポジション },
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
          ドロップダウン: { value: job.商流 },
          ドロップダウン_2: { value: job.契約形態 },
          ドロップダウン_3: { value: job.リモート },
          ドロップダウン_0: { value: job.外国籍 },
          数値: { value: job.募集人数 },
        },
      });

      jobIds.push(jobRecord.id);
      console.log(`✅ 案件レコード作成: ${job.案件名} (ID: ${jobRecord.id})`);
    }

    // 5. 応募履歴DBにレコード作成
    console.log("\n" + "=" .repeat(80));
    console.log("📝 Step 5: 応募履歴DBにレコードを作成");
    console.log("=" .repeat(80));

    // 応募履歴の案件IDとauth_user_idを動的に設定
    const applicationsWithJobIds = [
      {
        ...seedData.applications[0],
        auth_user_id: authUserId, // 実際のBetter AuthのユーザーIDを使用
        案件ID: jobIds[0], // 大手ECサイトのフロントエンド刷新案件
      },
      {
        ...seedData.applications[1],
        auth_user_id: authUserId, // 実際のBetter AuthのユーザーIDを使用
        案件ID: jobIds[2], // スタートアップ向け新規サービス開発
      },
    ];

    for (const application of applicationsWithJobIds) {
      const applicationRecord = await applicationClient.record.addRecord({
        app: appIds.application,
        record: {
          [APPLICATION_FIELDS.AUTH_USER_ID]: { value: application.auth_user_id },
          [APPLICATION_FIELDS.JOB_ID]: { value: application.案件ID },
          [APPLICATION_FIELDS.STATUS]: { value: application.対応状況 },
        },
      });

      console.log(`✅ 応募履歴レコード作成: auth_user_id=${application.auth_user_id}, 案件ID=${application.案件ID} (ID: ${applicationRecord.id})`);
    }

    console.log("\n" + "=" .repeat(80));
    console.log("🎉 シードデータの作成が完了しました！");
    console.log("=" .repeat(80));
    console.log("\n📊 作成されたデータ:");
    console.log(`  👤 Better Authユーザー: 1件`);
    console.log(`  👨‍💼 人材: 1件`);
    console.log(`  💼 案件: ${seedData.jobs.length}件`);
    console.log(`  📝 応募履歴: ${seedData.applications.length}件`);
    console.log("\n📝 ログイン情報:");
    console.log(`  メールアドレス: ${seedData.authUser.email}`);
    console.log(`  パスワード: ${seedData.authUser.password}`);
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

// シードデータ削除
export const deleteSeedData = async () => {
  console.log("\n🗑️  シードデータを削除します\n");
  console.log("⚠️  警告: すべてのレコードが削除されます！");

  try {
    const appIds = getAppIds();
    const talentClient = createTalentClient();
    const jobClient = createJobClient();
    const applicationClient = createApplicationClient();

    // 1. 応募履歴を全件削除
    console.log("\n" + "=" .repeat(80));
    console.log("📝 Step 1: 応募履歴を全件削除");
    console.log("=" .repeat(80));

    const applications = await applicationClient.record.getRecords({
      app: appIds.application,
    });

    if (applications.records.length > 0) {
      const applicationIds = applications.records.map((record: any) => record.$id.value);
      await applicationClient.record.deleteRecords({
        app: appIds.application,
        ids: applicationIds,
      });
      console.log(`✅ 応募履歴を削除: ${applicationIds.length}件`);
    } else {
      console.log("✅ 応募履歴: 削除対象なし");
    }

    // 2. 案件を全件削除
    console.log("\n" + "=" .repeat(80));
    console.log("💼 Step 2: 案件を全件削除");
    console.log("=" .repeat(80));

    const jobs = await jobClient.record.getRecords({
      app: appIds.job,
    });

    if (jobs.records.length > 0) {
      const jobIds = jobs.records.map((record: any) => record.$id.value);
      await jobClient.record.deleteRecords({
        app: appIds.job,
        ids: jobIds,
      });
      console.log(`✅ 案件を削除: ${jobIds.length}件`);
    } else {
      console.log("✅ 案件: 削除対象なし");
    }

    // 3. 人材を全件削除
    console.log("\n" + "=" .repeat(80));
    console.log("👨‍💼 Step 3: 人材を全件削除");
    console.log("=" .repeat(80));

    const talents = await talentClient.record.getRecords({
      app: appIds.talent,
    });

    if (talents.records.length > 0) {
      const talentIds = talents.records.map((record: any) => record.$id.value);
      await talentClient.record.deleteRecords({
        app: appIds.talent,
        ids: talentIds,
      });
      console.log(`✅ 人材を削除: ${talentIds.length}件`);
    } else {
      console.log("✅ 人材: 削除対象なし");
    }

    // 4. Better Authユーザーを削除
    console.log("\n" + "=" .repeat(80));
    console.log("👤 Step 4: Better Authユーザーを削除");
    console.log("=" .repeat(80));

    const sqlite = new Database(dbPath);
    
    // すべてのテーブルのレコード数を確認
    const userCount = sqlite.prepare("SELECT COUNT(*) as count FROM user").get() as { count: number };
    
    if (userCount.count > 0) {
      // すべてのテーブルを削除（外部キー制約の順番に注意）
      sqlite.prepare("DELETE FROM session").run();
      sqlite.prepare("DELETE FROM account").run();
      sqlite.prepare("DELETE FROM verification").run();
      sqlite.prepare("DELETE FROM user").run();
      
      console.log(`✅ ユーザーを削除: ${userCount.count}件`);
    } else {
      console.log("✅ ユーザー: 削除対象なし");
    }

    sqlite.close();

    console.log("\n" + "=" .repeat(80));
    console.log("🎉 シードデータの削除が完了しました！");
    console.log("=" .repeat(80));
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

// コマンドライン引数で処理を分岐
const command = process.argv[2];

if (command === "create") {
  createSeedData();
} else if (command === "delete") {
  deleteSeedData();
} else {
  console.error("使用方法:");
  console.error("  npm run seed:create  - シードデータを作成");
  console.error("  npm run seed:delete  - シードデータを全件削除");
  process.exit(1);
}

