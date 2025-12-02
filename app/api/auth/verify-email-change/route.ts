import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

// Vercel 環境では機能しない
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

export const GET = async (request: NextRequest) => {
  // Vercel 環境では機能しないことを返す
  if (isVercel) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=demo_environment", request.url)
    );
  }

  try {
    const db = getDb();

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
    const verification = await db.select()
      .from(schema.verification)
      .where(
        and(
          eq(schema.verification.id, token),
          eq(schema.verification.identifier, userId),
          eq(schema.verification.value, newEmail),
          gt(schema.verification.expiresAt, new Date())
        )
      )
      .then(rows => rows[0]);

    if (!verification) {
      return NextResponse.redirect(
        new URL("/auth/signin?error=expired_token", request.url)
      );
    }

    // ユーザーのメールアドレスを更新
    await db.update(schema.user)
      .set({
        email: newEmail,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId));

    // accountテーブルのaccountIdも更新
    await db.update(schema.account)
      .set({
        accountId: newEmail,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.account.userId, userId),
          eq(schema.account.providerId, "credential")
        )
      );

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
    await db.delete(schema.verification)
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
