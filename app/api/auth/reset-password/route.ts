import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";

export const POST = async (request: NextRequest) => {
  try {
    const db = getDb();

    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "トークンとパスワードが必要です" },
        { status: 400 }
      );
    }

    // トークンからメールアドレスを取得（簡易版）
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [email] = decoded.split(":");

    if (!email) {
      return NextResponse.json(
        { error: "無効なトークンです" },
        { status: 400 }
      );
    }

    // ユーザーを取得
    const user = await db.select().from(schema.user).where(eq(schema.user.email, email)).then(rows => rows[0]);

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // パスワードをハッシュ化（better-auth の公式関数を使用）
    const hashedPassword = await hashPassword(password);

    // アカウントテーブルのパスワードを更新
    await db.update(schema.account)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(schema.account.userId, user.id));

    console.log("✅ パスワードリセット成功:", email);

    return NextResponse.json(
      { message: "パスワードがリセットされました" },
      { status: 200 }
    );
  } catch (error) {
    console.error("パスワードリセットエラー:", error);
    return NextResponse.json(
      { error: "パスワードのリセットに失敗しました" },
      { status: 500 }
    );
  }
};
