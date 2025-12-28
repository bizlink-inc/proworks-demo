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
// calculateTopMatches は PRECOMPUTED_RECOMMENDATIONS 使用により不要になりました
import { seedData3 } from "./seed-data-large";
import { JOB_FIELD_OPTIONS } from "./seed-data-options";
import { PRECOMPUTED_RECOMMENDATIONS } from "./seed-data-recommendations";
import { seedData2 } from "./seed-data-matching";
import { createSeedData1 } from "./seed-data-yamada";
import { getDb, closePool, query, schema, switchDatabase } from "../lib/db/client";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
// Better Authの公式ハッシュ関数を使用
import { hashPassword as hashPasswordBetterAuth } from "better-auth/crypto";
import { auth } from "../lib/auth";
import { sendInterviewConfirmedEmail } from "../lib/email";

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

// seedData1は seed-data-yamada.ts に移動（generateDevCreatedAtを使用するためファクトリ関数パターン）
const seedData1 = createSeedData1(generateDevCreatedAt);

// seedData2は seed-data-matching.ts に移動しました

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
          ...(job.作成日時_開発環境 ? { 作成日時_開発環境: { value: job.作成日時_開発環境 } } : {}),
      };
      });

    const jobCreateResult = await jobClient.record.addRecords({
      app: appIds.job,
      records: jobRecords as any,
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

    // 事前計算済みデータから推薦レコードを作成（calculateTopMatches呼び出し不要）
    const allRecommendationRecords: any[] = [];

    for (const rec of PRECOMPUTED_RECOMMENDATIONS) {
      const jobId = jobIds[rec.jobIndex];
      if (!jobId) continue;

      allRecommendationRecords.push({
        [RECOMMENDATION_FIELDS.TALENT_ID]: { value: rec.talentAuthUserId },
        [RECOMMENDATION_FIELDS.JOB_ID]: { value: jobId },
        [RECOMMENDATION_FIELDS.SCORE]: { value: rec.score },
      });
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

      if (existingJobs.length > 0) {
        // 更新
        const existingId = (existingJobs[0] as any).$id.value;
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

    // 面談予定確定のメール送信（通知のトリガー）
    console.log("\n📧 面談予定確定メールを送信します...");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const interviewJobTitle = "スタートアップ向け新規サービス開発";
    const userName = seedData.talents[0].氏名;
    const userEmail = seedData.authUsers[0].email;

    try {
      const result = await sendInterviewConfirmedEmail(
        userEmail,
        userName,
        interviewJobTitle,
        baseUrl
      );
      if (result.success) {
        console.log(`✅ 面談予定確定メール送信成功: ${userEmail}`);
      } else {
        console.log(`⚠️ 面談予定確定メール送信失敗: ${result.error}`);
      }
    } catch (emailError) {
      console.log(`⚠️ 面談予定確定メール送信エラー:`, emailError);
    }

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
