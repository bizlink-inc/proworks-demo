import { NextRequest, NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.join(process.cwd(), "auth.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

export const POST = async (request: NextRequest) => {
  try {
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
    const user = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // アカウントテーブルのパスワードを更新
    await db
      .update(schema.account)
      .set({ password: hashedPassword })
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

