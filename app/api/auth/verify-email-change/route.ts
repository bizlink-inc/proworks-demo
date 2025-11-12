import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, gt } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import path from "path";

const dbPath = path.join(process.cwd(), "auth.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const newEmail = searchParams.get("email");
    const userId = searchParams.get("userId");

    if (!token || !newEmail || !userId) {
      return NextResponse.redirect(
        new URL("/auth/signin?error=invalid_token", request.url)
      );
    }

    // トークンを検証
    const verification = await db.query.verification.findFirst({
      where: and(
        eq(schema.verification.id, token),
        eq(schema.verification.identifier, userId),
        eq(schema.verification.value, newEmail),
        gt(schema.verification.expiresAt, new Date())
      ),
    });

    if (!verification) {
      return NextResponse.redirect(
        new URL("/auth/signin?error=expired_token", request.url)
      );
    }

    // ユーザーのメールアドレスを更新
    await db
      .update(schema.user)
      .set({
        email: newEmail,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId));

    // accountテーブルのaccountIdも更新
    await db
      .update(schema.account)
      .set({
        accountId: newEmail,
        updatedAt: new Date(),
      })
      .where(and(
        eq(schema.account.userId, userId),
        eq(schema.account.providerId, "credential")
      ));

    // kintoneの人材DBのメールアドレスも更新
    try {
      const { getTalentByAuthUserId, updateTalent } = await import("@/lib/kintone/services/talent");
      const talent = await getTalentByAuthUserId(userId);
      
      if (talent) {
        await updateTalent(talent.id, { email: newEmail });
        console.log("✅ kintone人材DBのメールアドレスも更新しました");
      }
    } catch (kintoneError) {
      console.error("⚠️ kintone更新エラー（メールアドレス変更は完了）:", kintoneError);
    }

    // 使用済みトークンを削除
    await db
      .delete(schema.verification)
      .where(eq(schema.verification.id, verification.id));

    console.log("✅ メールアドレス変更完了:", userId, "→", newEmail);

    // 成功ページにリダイレクト
    return NextResponse.redirect(
      new URL("/auth/email-changed", request.url)
    );
  } catch (error) {
    console.error("メールアドレス確認エラー:", error);
    return NextResponse.redirect(
      new URL("/auth/signin?error=verification_failed", request.url)
    );
  }
};

