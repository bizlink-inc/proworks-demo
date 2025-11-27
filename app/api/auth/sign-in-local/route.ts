import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import * as argon2 from "argon2";
import path from "path";
import { cookies } from "next/headers";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "メールアドレスとパスワードが必要です" },
        { status: 400 }
      );
    }

    // SQLite に接続
    const dbPath = path.join(process.cwd(), "auth.db");
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema });

    // ユーザーを検索
    const user = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { message: "メールアドレスまたはパスワードが正しくありません" },
        { status: 401 }
      );
    }

    // アカウント情報を取得（パスワードハッシュ）
    const account = await db.query.account.findFirst({
      where: eq(schema.account.userId, user.id),
    });

    if (!account || !account.password) {
      return NextResponse.json(
        { message: "パスワードが設定されていません" },
        { status: 401 }
      );
    }

    // パスワードを検証
    const isPasswordValid = await argon2.verify(account.password, password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "メールアドレスまたはパスワードが正しくありません" },
        { status: 401 }
      );
    }

    // セッションを作成
    const sessionToken = require("crypto").randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30日

    await db.insert(schema.session).values({
      id: require("crypto").randomBytes(16).toString("hex"),
      userId: user.id,
      token: sessionToken,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // クッキーにセッションを設定
    const cookieStore = await cookies();
    cookieStore.set("better-auth.session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30日
    });

    sqlite.close();

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      session: {
        id: sessionToken,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ ログインエラー:", error);
    return NextResponse.json(
      { message: "ログインに失敗しました" },
      { status: 500 }
    );
  }
};

