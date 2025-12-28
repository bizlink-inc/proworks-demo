/**
 * シードデータ作成スクリプト
 *
 * 使用方法:
 *   npm run seed:create  - シードデータを作成
 *   npm run seed:delete  - シードデータを全件削除
 *   npm run seed:upsert  - yamadaシードデータをUpsert
 */

// 環境変数を読み込む
import { config } from "dotenv";
config({ path: ".env.local" });
try {
  config({ path: ".aws-resources.env" });
} catch {
  // ファイルが存在しない場合は無視
}

import { closePool } from "../lib/db/client";
import { sendInterviewConfirmedEmail } from "../lib/email";
import { RECOMMENDATION_FIELDS } from "../lib/kintone/fieldMapping";

// シードデータ
import { seedData3 } from "./seed-data-large";
import { seedData2 } from "./seed-data-matching";
import { PRECOMPUTED_RECOMMENDATIONS } from "./seed-data-recommendations";
import { createSeedData1 } from "./seed-data-yamada";

// ユーティリティ
import { generateDevCreatedAt, uploadResumeFile } from "./seed-utils";

// 認証
import {
  AuthUserData,
  createAuthUsers,
  createAuthUsersInDb,
  deleteAllAuthUsers,
  getExistingUserMapping,
  resolveUserId,
  upsertAuthUser,
} from "./seed-auth";

// レコードビルダー
import {
  buildApplicationRecord,
  buildJobRecord,
  buildJobRecordRaw,
  buildRecommendationRecord,
  buildTalentRecord,
  JobData,
  TalentData,
} from "./seed-record-builders";

// kintone操作
import {
  addApplicationRecords,
  addJobRecords,
  addRecommendationRecordsInBatches,
  addTalentRecords,
  createAnnouncementRecords,
  deleteAllRecords,
  deleteInquiryRecords,
  resetTalentWithdrawalStatus,
  upsertApplicationRecord,
  upsertJobRecord,
  upsertRecommendationRecord,
  upsertRecommendationRecords,
  upsertTalentRecord,
} from "./seed-kintone";

// 固定ID
const YAMADA_AUTH_USER_ID = "seed_user_001";
const HANAKO_AUTH_USER_ID = "seed_user_002";

// seedData1を生成
const seedData1 = createSeedData1(generateDevCreatedAt);

// ========================================
// シードデータ作成
// ========================================
export const createSeedData = async () => {
  console.log("\n🌱 シードデータを作成します...\n");

  // データ統合
  const seedData = mergeData(seedData1, seedData3);
  console.log(
    `📊 データ: ユーザー${seedData.authUsers.length}人, ` +
      `人材${seedData.talents.length}人, 案件${seedData.jobs.length}件, ` +
      `応募${seedData.applications.length}件`
  );

  try {
    const skipAuthUserCreation = process.env.SEED_KINTONE_ONLY === "true";
    let authUserIds: string[] = [];
    let mapping = { existingEmails: new Map(), existingIds: new Map() };

    // 1. Better Authユーザー作成
    if (skipAuthUserCreation) {
      console.log(`\n[1/6] Better Authユーザー作成をスキップ（Dualモード）`);
      authUserIds = seedData.authUsers.map((u) => u.id);
      console.log(`   → シードデータから${authUserIds.length}人のIDを取得`);
    } else {
      console.log(`\n[1/6] Better Authユーザーを作成中...`);
      mapping = await getExistingUserMapping();
      authUserIds = await createAuthUsers(seedData.authUsers, mapping);
    }

    // 2. 人材DB作成
    console.log(`\n[2/6] 人材DBにレコードを作成中...`);
    const hanakoResumeFiles = await uploadResumeFile(
      "test-file/Backend_Engineer_Resume_sample.pdf"
    );

    const talentRecords = seedData.talents.map((talent) => {
      const userId = resolveUserId(
        talent.auth_user_id,
        talent.メールアドレス,
        seedData.authUsers,
        authUserIds,
        mapping
      );
      if (!userId) {
        throw new Error(`ユーザーIDが見つかりません: ${talent.氏名}`);
      }

      const isHanako = talent.auth_user_id === HANAKO_AUTH_USER_ID;
      return buildTalentRecord(talent as TalentData, userId, {
        resumeFiles: isHanako ? hanakoResumeFiles : [],
        clearExperience: isHanako,
      });
    });

    const talentRecordIds = await addTalentRecords(talentRecords);
    console.log(`   → ${talentRecordIds.length}人を作成完了`);

    // 3. 案件DB作成
    console.log(`\n[3/6] 案件DBにレコードを作成中...`);
    const jobRecords = seedData.jobs.map((job) => buildJobRecord(job as JobData));
    const jobIds = await addJobRecords(jobRecords);
    console.log(`   → ${jobIds.length}件を作成完了`);

    // 4. 応募履歴DB作成
    console.log(`\n[4/6] 応募履歴DBにレコードを作成中...`);
    const applicationRecords = seedData.applications.map((app: any) => {
      const userId = resolveUserId(
        app.auth_user_id,
        "",
        seedData.authUsers,
        authUserIds,
        mapping
      );
      if (!userId) {
        throw new Error(`ユーザーIDが見つかりません: ${app.auth_user_id}`);
      }
      return buildApplicationRecord(
        userId,
        jobIds[app.jobIndex],
        app.対応状況,
        app.作成日時_開発環境
      );
    });

    const appIds = await addApplicationRecords(applicationRecords);
    console.log(`   → ${appIds.length}件を作成完了`);

    // 5. 推薦データ作成（全レコードを一括追加）
    console.log(`\n[5/6] 推薦データを作成中...`);
    const allRecommendationRecords = [
      // 事前計算済み推薦
      ...PRECOMPUTED_RECOMMENDATIONS.filter((rec) => jobIds[rec.jobIndex]).map((rec) =>
        buildRecommendationRecord(rec.talentAuthUserId, jobIds[rec.jobIndex], rec.score)
      ),
      // yamada用
      ...buildUserRecommendationRecords(
        YAMADA_AUTH_USER_ID,
        jobIds,
        seedData1.recommendations,
        seedData1.recommendationsForYamada
      ),
      // hanako用
      ...buildUserRecommendationRecords(
        HANAKO_AUTH_USER_ID,
        jobIds,
        [],
        seedData1.recommendationsForHanako
      ),
    ];

    await addRecommendationRecordsInBatches(allRecommendationRecords);
    console.log(`   → ${allRecommendationRecords.length}件を作成完了`);

    // 6. お知らせ作成
    console.log(`\n[6/6] システム通知を作成中...`);
    const announcementCount = await createAnnouncementRecords();
    if (announcementCount > 0) {
      console.log(`   → ${announcementCount}件を作成完了`);
    }

    // 完了メッセージ
    printCompletionMessage(seedData, allRecommendationRecords.length);
  } catch (error) {
    handleError(error);
  }
};

// ========================================
// シードデータ削除
// ========================================
export const deleteSeedData = async () => {
  console.log("\n🗑️  シードデータを削除します...\n");

  try {
    const counts = await deleteAllRecords();
    const userCount = await deleteAllAuthUsers();
    await closePool();

    console.log("🎉 シードデータの削除が完了しました！");
    console.log(
      `   推薦: ${counts.recommendation}件, 応募: ${counts.application}件, ` +
        `案件: ${counts.job}件`
    );
    console.log(
      `   人材: ${counts.talent}件, 通知: ${counts.announcement}件, ` +
        `ユーザー: ${userCount}件\n`
    );
  } catch (error) {
    handleError(error);
  }
};

// ========================================
// yamada Upsert
// ========================================
const upsertYamadaSeedData = async () => {
  console.log("\n🔄 yamada シードデータを Upsert（更新 or 作成）します\n");
  console.log("📌 auth_user_id:", YAMADA_AUTH_USER_ID);
  console.log("📌 この ID は Vercel 環境と共有されます\n");

  try {
    // Step 0: クリーンアップ
    console.log("=".repeat(80));
    console.log("🧹 Step 0: 問い合わせ・退会DBのクリーンアップ & STフィールドのリセット");
    console.log("=".repeat(80));
    await deleteInquiryRecords();
    await resetTalentWithdrawalStatus(YAMADA_AUTH_USER_ID);
    console.log("");

    const seedData = seedData1;

    // Step 1: Better Auth ユーザー
    console.log("=".repeat(80));
    console.log("👤 Step 1: Better Auth ユーザーを Upsert");
    console.log("=".repeat(80));
    await upsertAuthUser(seedData.authUsers[0], YAMADA_AUTH_USER_ID);

    // Step 2: 人材DB
    console.log("\n" + "=".repeat(80));
    console.log("👨‍💼 Step 2: 人材DBを Upsert");
    console.log("=".repeat(80));
    const talent = seedData.talents[0];
    const talentRecord = buildTalentRecord(talent as TalentData, YAMADA_AUTH_USER_ID);
    await upsertTalentRecord(YAMADA_AUTH_USER_ID, talentRecord);

    // Step 3: 案件DB
    console.log("\n" + "=".repeat(80));
    console.log("💼 Step 3: 案件DBを Upsert");
    console.log("=".repeat(80));
    const jobIds: string[] = [];
    for (const job of seedData.jobs) {
      const jobRecord = buildJobRecordRaw(job as JobData);
      const jobId = await upsertJobRecord(job.案件名, jobRecord);
      jobIds.push(jobId);
    }

    // Step 4: 応募履歴DB
    console.log("\n" + "=".repeat(80));
    console.log("📝 Step 4: 応募履歴DBを Upsert");
    console.log("=".repeat(80));
    for (const application of seedData.applications) {
      const jobId = jobIds[application.jobIndex];
      const record = buildApplicationRecord(
        YAMADA_AUTH_USER_ID,
        jobId,
        application.対応状況,
        (application as any).作成日時_開発環境
      );
      await upsertApplicationRecord(YAMADA_AUTH_USER_ID, jobId, record);
    }

    // Step 5: 推薦DB
    console.log("\n" + "=".repeat(80));
    console.log("⭐ Step 5: 推薦DBを Upsert（表示順確認用）");
    console.log("=".repeat(80));
    await upsertYamadaRecommendations(seedData, jobIds);

    // 完了メッセージ
    printUpsertCompletionMessage(seedData, jobIds.length);

    // 面談予定確定メール送信
    await sendInterviewEmail(seedData);
  } catch (error) {
    handleError(error);
  }
};

// ========================================
// Dual モード
// ========================================
const createSeedDataDual = async () => {
  console.log(
    "🔄 Dual モード: ローカルDB と AWS RDS の両方にシードデータを作成します\n"
  );

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL が設定されていません。");
    process.exit(1);
  }

  const allAuthUsers = [...seedData1.authUsers, ...seedData2.authUsers];
  await createAuthUsersInDb("local", allAuthUsers);
  await createAuthUsersInDb("rds", allAuthUsers);

  console.log("\n📦 Kintone にタレント・案件データを作成します...");
  process.env.SEED_KINTONE_ONLY = "true";
  await createSeedData();
  delete process.env.SEED_KINTONE_ONLY;

  await closePool();
  console.log("\n✅ Dual モード完了: 両環境でシードユーザーが使用可能です");
  console.log("   ログイン: seed_yamada@example.com / password123");
};

// ========================================
// ヘルパー関数
// ========================================

/** データ統合 */
const mergeData = (data1: any, data3: any) => {
  const data1UserIds = new Set(data1.authUsers.map((u: any) => u.id));
  const data1Emails = new Set(data1.authUsers.map((u: any) => u.email));

  const uniqueUsers = data3.authUsers.filter(
    (u: any) => !data1UserIds.has(u.id) && !data1Emails.has(u.email)
  );

  const data1TalentIds = new Set(data1.talents.map((t: any) => t.auth_user_id));
  const uniqueTalents = data3.talents.filter(
    (t: any) => !data1TalentIds.has(t.auth_user_id)
  );

  return {
    authUsers: [...data1.authUsers, ...uniqueUsers],
    talents: [...data1.talents, ...uniqueTalents],
    jobs: [...data1.jobs, ...data3.jobs],
    applications: [...data1.applications, ...data3.applications],
    recommendations: data1.recommendations,
  };
};

/** ユーザー推薦レコード構築（同期） */
const buildUserRecommendationRecords = (
  authUserId: string,
  jobIds: string[],
  basicRecommendations: any[],
  extendedRecommendations?: any[]
): any[] => {
  const records: any[] = [];

  // 基本推薦
  for (const rec of basicRecommendations) {
    if (rec.jobIndex < jobIds.length && jobIds[rec.jobIndex]) {
      records.push(
        buildRecommendationRecord(authUserId, jobIds[rec.jobIndex], rec.score)
      );
    }
  }

  // 拡張推薦（担当者おすすめ/AIマッチ）
  if (extendedRecommendations) {
    for (const rec of extendedRecommendations) {
      if (rec.jobIndex < jobIds.length && jobIds[rec.jobIndex]) {
        records.push(
          buildRecommendationRecord(authUserId, jobIds[rec.jobIndex], rec.score, {
            staffRecommend: rec.staffRecommend,
            aiMatched: rec.aiMatched,
          })
        );
      }
    }
  }

  return records;
};

/** ユーザーのauth_user_idを解決 */
const resolveUserAuthId = (
  targetUserId: string,
  seedData: any,
  authUserIds: string[],
  mapping: any
): string | undefined => {
  const user = seedData.authUsers.find((u: any) => u.id === targetUserId);
  if (!user) return undefined;

  if (mapping.existingIds.has(user.id)) {
    return mapping.existingIds.get(user.id);
  }
  if (mapping.existingEmails.has(user.email)) {
    return mapping.existingEmails.get(user.email);
  }

  const userIndex = seedData.authUsers.findIndex(
    (u: any) => u.id === user.id || u.email === user.email
  );
  return userIndex >= 0 ? authUserIds[userIndex] : user.id;
};

/** yamada推薦Upsert */
const upsertYamadaRecommendations = async (seedData: any, jobIds: string[]) => {
  // 応募済み案件
  for (const rec of seedData.recommendations) {
    const jobId = jobIds[rec.jobIndex];
    const record = buildRecommendationRecord(YAMADA_AUTH_USER_ID, jobId, rec.score);
    await upsertRecommendationRecord(
      YAMADA_AUTH_USER_ID,
      jobId,
      record,
      `案件ID=${jobId}, スコア=${rec.score}`
    );
  }

  // 案件一覧用
  if (seedData.recommendationsForYamada) {
    for (const rec of seedData.recommendationsForYamada) {
      if (rec.jobIndex >= jobIds.length) {
        console.log(`⚠️ jobIndex ${rec.jobIndex} は範囲外です`);
        continue;
      }
      const jobId = jobIds[rec.jobIndex];
      const record = buildRecommendationRecord(YAMADA_AUTH_USER_ID, jobId, rec.score, {
        staffRecommend: rec.staffRecommend,
        aiMatched: rec.aiMatched,
      });

      const flags = [];
      if (rec.staffRecommend) flags.push("担当者おすすめ");
      if (rec.aiMatched) flags.push("AIマッチ");
      const flagStr = flags.length > 0 ? `, ${flags.join(" + ")}` : "";

      await upsertRecommendationRecord(
        YAMADA_AUTH_USER_ID,
        jobId,
        record,
        `案件ID=${jobId}, スコア=${rec.score}${flagStr}`
      );
    }
  }
};

/** 面談予定確定メール送信 */
const sendInterviewEmail = async (seedData: any) => {
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
};

/** 完了メッセージ */
const printCompletionMessage = (seedData: any, totalRecommendations: number) => {
  console.log("\n🎉 シードデータの作成が完了しました！");
  console.log(
    `   ユーザー: ${seedData.authUsers.length}人, ` +
      `人材: ${seedData.talents.length}人, 案件: ${seedData.jobs.length}件`
  );
  console.log(
    `   応募: ${seedData.applications.length}件, 推薦: ${totalRecommendations}件`
  );
  console.log(`\n📝 ログイン: seed_yamada@example.com / password123`);
  console.log(`            seed_hanako@example.com / password123\n`);
};

/** Upsert完了メッセージ */
const printUpsertCompletionMessage = (seedData: any, jobCount: number) => {
  console.log("\n" + "=".repeat(80));
  console.log("🎉 yamada シードデータの Upsert が完了しました！");
  console.log("=".repeat(80));
  console.log("\n📊 処理されたデータ:");
  console.log(`  👤 Better Authユーザー: 1件`);
  console.log(`  👨‍💼 人材: 1件`);
  console.log(`  💼 案件: ${jobCount}件`);
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

  console.log("\n💡 Vercel 環境でも同じ auth_user_id でログインできます\n");
};

/** エラーハンドリング */
const handleError = (error: unknown) => {
  console.error("\n❌ エラーが発生しました:", error);
  if (error instanceof Error) {
    console.error("エラーメッセージ:", error.message);
    console.error("スタックトレース:", error.stack);
  }
  process.exit(1);
};

// ========================================
// CLI エントリーポイント
// ========================================
const isDualMode = process.argv.includes("--dual");
const command = process.argv[2];

const commands: Record<string, () => void> = {
  create: () => (isDualMode ? createSeedDataDual() : createSeedData()),
  delete: deleteSeedData,
  upsert: upsertYamadaSeedData,
  "create:1": () => {
    process.argv[3] = "1";
    isDualMode ? createSeedDataDual() : createSeedData();
  },
  "create:2": () => {
    process.argv[3] = "2";
    isDualMode ? createSeedDataDual() : createSeedData();
  },
  "create:3": () => {
    process.argv[3] = "3";
    createSeedData();
  },
};

if (command && commands[command]) {
  commands[command]();
} else {
  console.error("使用方法:");
  console.error("  npm run seed:create            - シードデータを作成");
  console.error("  npm run seed:create -- --dual  - 両環境（ローカル+AWS）にシードを作成");
  console.error("  npm run seed:create:1          - セット1を作成");
  console.error("  npm run seed:create:2          - セット2を作成");
  console.error("  npm run seed:create:3          - セット3を作成（50人+50案件）");
  console.error("  npm run seed:upsert            - yamadaシードデータをUpsert");
  console.error("  npm run seed:delete            - シードデータを全件削除");
  process.exit(1);
}
