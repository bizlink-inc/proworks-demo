import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.join(process.cwd(), "auth.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

export const POST = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "現在のパスワードと新しいパスワードが必要です" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "新しいパスワードは6文字以上である必要があります" },
        { status: 400 }
      );
    }

    // ユーザーのアカウント情報を取得
    const account = await db.query.account.findFirst({
      where: and(
        eq(schema.account.userId, session.user.id),
        eq(schema.account.providerId, "credential")
      ),
    });

    if (!account || !account.password) {
      return NextResponse.json(
        { error: "アカウント情報が見つかりません" },
        { status: 404 }
      );
    }

    // 現在のパスワードを検証
    const isValidPassword = await bcrypt.compare(currentPassword, account.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "現在のパスワードが正しくありません" },
        { status: 400 }
      );
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // パスワードを更新
    await db
      .update(schema.account)
      .set({ password: hashedPassword })
      .where(eq(schema.account.id, account.id));

    console.log("✅ パスワード変更成功:", session.user.email);

    return NextResponse.json(
      { message: "パスワードが変更されました" },
      { status: 200 }
    );
  } catch (error) {
    console.error("パスワード変更エラー:", error);
    return NextResponse.json(
      { error: "パスワード変更に失敗しました" },
      { status: 500 }
    );
  }
};

