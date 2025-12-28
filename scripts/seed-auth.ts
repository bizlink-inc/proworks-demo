/**
 * Better Auth関連のシードデータ処理
 */

import { hashPassword as hashPasswordBetterAuth } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { getDb, schema, switchDatabase } from "../lib/db/client";
import { generateId } from "./seed-utils";

/** 認証ユーザーデータ型 */
export interface AuthUserData {
  id: string;
  name: string;
  email: string;
  password: string;
  image?: string | null;
}

/** ユーザーIDマッピング */
export interface UserIdMapping {
  existingEmails: Map<string, string>;
  existingIds: Map<string, string>;
}

/** 既存ユーザーのマッピングを取得 */
export const getExistingUserMapping = async (): Promise<UserIdMapping> => {
  const db = getDb();
  const existingEmails = new Map<string, string>();
  const existingIds = new Map<string, string>();

  const existingRows = await db
    .select({ email: schema.user.email, id: schema.user.id })
    .from(schema.user);

  for (const row of existingRows) {
    existingEmails.set(row.email, row.id);
    existingIds.set(row.id, row.id);
  }

  return { existingEmails, existingIds };
};

/** ユーザーIDを解決（既存 or 新規） */
export const resolveUserId = (
  authUserId: string,
  email: string,
  authUsers: AuthUserData[],
  authUserIds: string[],
  mapping: UserIdMapping
): string | undefined => {
  const matchingUser = authUsers.find(
    (u) => u.id === authUserId || u.email === email
  );

  if (!matchingUser) {
    return authUserId;
  }

  if (matchingUser.id && mapping.existingIds.has(matchingUser.id)) {
    return mapping.existingIds.get(matchingUser.id);
  }

  if (mapping.existingEmails.has(matchingUser.email)) {
    return mapping.existingEmails.get(matchingUser.email);
  }

  const userIndex = authUsers.indexOf(matchingUser);
  return authUserIds[userIndex];
};

/** 認証ユーザーを一括作成 */
export const createAuthUsers = async (
  users: AuthUserData[],
  mapping: UserIdMapping
): Promise<string[]> => {
  const db = getDb();
  const authUserIds: string[] = [];

  // 新規・既存ユーザーを分類
  const newUsers = users.filter(
    (user) =>
      !mapping.existingIds.has(user.id) &&
      !mapping.existingEmails.has(user.email)
  );

  const skippedUsers = users.filter(
    (user) =>
      mapping.existingIds.has(user.id) ||
      mapping.existingEmails.has(user.email)
  );

  // 既存ユーザーのIDを追加
  for (const user of skippedUsers) {
    const existingId = user.id && mapping.existingIds.has(user.id)
      ? mapping.existingIds.get(user.id)!
      : mapping.existingEmails.get(user.email)!;
    authUserIds.push(existingId);
  }

  if (skippedUsers.length > 0) {
    console.log(`   既存ユーザー: ${skippedUsers.length}人（スキップ）`);
  }

  if (newUsers.length > 0) {
    const hashedPassword = await hashPasswordBetterAuth("password123");
    const now = new Date();

    const userRecords = newUsers.map((user) => {
      const userId = user.id || generateId(32);
      authUserIds.push(userId);
      return {
        id: userId,
        name: user.name,
        email: user.email,
        emailVerified: true,
        image: null,
        createdAt: now,
        updatedAt: now,
      };
    });

    const accountRecords = userRecords.map((user) => ({
      id: generateId(32),
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    }));

    await db.insert(schema.user).values(userRecords);
    await db.insert(schema.account).values(accountRecords);

    console.log(`   新規作成: ${newUsers.length}人`);
  }

  console.log(`   → 合計${authUserIds.length}人を処理完了`);
  return authUserIds;
};

/** 単一ユーザーをUpsert */
export const upsertAuthUser = async (
  userData: AuthUserData,
  targetUserId: string
): Promise<void> => {
  const db = getDb();

  const existingUserById = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, targetUserId))
    .then((rows) => rows[0]);

  const existingUserByEmail = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, userData.email))
    .then((rows) => rows[0]);

  if (existingUserById) {
    console.log(`✅ 既存ユーザーを確認（ID一致）: ${targetUserId}`);
    await db
      .update(schema.user)
      .set({
        name: userData.name,
        email: userData.email,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, targetUserId));
    console.log(`✅ ユーザー情報を更新しました`);

    await upsertAccountPassword(targetUserId, userData.password);
  } else if (existingUserByEmail) {
    console.log(`⚠️ 同じメールアドレスで別のユーザーが存在: ${existingUserByEmail.id}`);
    console.log(`🔄 既存ユーザーを削除して、正しい ID で再作成します`);

    await deleteUserCascade(existingUserByEmail.id);
    await createNewUser(userData, targetUserId);
    console.log(`✅ 正しい ID でユーザーを再作成しました`);
  } else {
    console.log(`📝 新規ユーザーを作成: ${targetUserId}`);
    await createNewUser(userData, targetUserId);
    console.log(`✅ 新規ユーザーを作成しました`);
  }
};

/** アカウントのパスワードをUpsert */
const upsertAccountPassword = async (
  userId: string,
  password: string
): Promise<void> => {
  const db = getDb();
  const existingAccount = await db
    .select()
    .from(schema.account)
    .where(eq(schema.account.userId, userId))
    .then((rows) => rows[0]);

  const hashedPassword = await hashPasswordBetterAuth(password);

  if (existingAccount) {
    await db
      .update(schema.account)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(schema.account.userId, userId));
    console.log(`✅ パスワードを更新しました`);
  } else {
    await db.insert(schema.account).values({
      id: generateId(32),
      userId,
      accountId: userId,
      providerId: "credential",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ accountレコードを作成しました`);
  }
};

/** ユーザーを削除（関連レコード含む） */
const deleteUserCascade = async (userId: string): Promise<void> => {
  const db = getDb();
  await db.delete(schema.session).where(eq(schema.session.userId, userId));
  await db.delete(schema.account).where(eq(schema.account.userId, userId));
  await db.delete(schema.user).where(eq(schema.user.id, userId));
  console.log(`✅ 既存ユーザーを削除しました`);
};

/** 新規ユーザーを作成 */
const createNewUser = async (
  userData: AuthUserData,
  userId: string
): Promise<void> => {
  const db = getDb();
  const hashedPassword = await hashPasswordBetterAuth(userData.password);
  const now = new Date();

  await db.insert(schema.user).values({
    id: userId,
    name: userData.name,
    email: userData.email,
    emailVerified: true,
    image: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.account).values({
    id: generateId(32),
    userId,
    accountId: userId,
    providerId: "credential",
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  });
};

/** 全ユーザーを削除 */
export const deleteAllAuthUsers = async (): Promise<number> => {
  const db = getDb();
  const users = await db.select({ id: schema.user.id }).from(schema.user);
  const userCount = users.length;

  if (userCount > 0) {
    await db.delete(schema.session);
    await db.delete(schema.account);
    await db.delete(schema.verification);
    await db.delete(schema.user);
  }

  return userCount;
};

/** 特定DBに認証ユーザーを作成 */
export const createAuthUsersInDb = async (
  targetDb: "local" | "rds",
  users: AuthUserData[]
): Promise<void> => {
  await switchDatabase(targetDb);
  const db = getDb();

  console.log(
    `\n📦 ${targetDb === "local" ? "ローカルDB" : "AWS RDS"} に認証ユーザーを作成します...`
  );

  for (const userData of users) {
    try {
      const existingUser = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.email, userData.email))
        .limit(1);

      if (existingUser.length > 0) {
        console.log(`⏭️  ユーザー ${userData.email} は既に存在します（${targetDb}）`);
        continue;
      }

      const hashedPassword = await hashPasswordBetterAuth(userData.password);

      await db.insert(schema.user).values({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: true,
        image: userData.image,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

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
