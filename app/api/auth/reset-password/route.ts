import { NextRequest, NextResponse } from "next/server";

// Vercel 環境では SQLite が使用できないため、この API は機能しません
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

export const POST = async (request: NextRequest) => {
  // Vercel 環境では機能しないことを返す
  if (isVercel) {
    return NextResponse.json(
      { error: "この機能はデモ環境では利用できません" },
      { status: 503 }
    );
  }

  // ローカル環境でのみ動的インポート
  try {
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const Database = (await import("better-sqlite3")).default;
    const { eq } = await import("drizzle-orm");
    const schema = await import("@/lib/db/schema");
    const bcrypt = await import("bcryptjs");
    const path = await import("path");

    const dbPath = path.join(process.cwd(), "auth.db");
    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite, { schema });

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
