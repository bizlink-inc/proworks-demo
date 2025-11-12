import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import path from "path";
import { randomBytes } from "crypto";

const dbPath = path.join(process.cwd(), "auth.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

export const POST = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newEmail } = body;

    if (!currentPassword || !newEmail) {
      return NextResponse.json(
        { error: "現在のパスワードと新しいメールアドレスが必要です" },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // 現在のメールアドレスと同じかチェック
    if (newEmail === session.user.email) {
      return NextResponse.json(
        { error: "現在のメールアドレスと同じです" },
        { status: 400 }
      );
    }

    // 既に使用されているメールアドレスかチェック
    const existingUser = await db.query.user.findFirst({
      where: eq(schema.user.email, newEmail),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に使用されています" },
        { status: 400 }
      );
    }

    // ユーザーのアカウント情報を取得してパスワード検証
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

    // トークンを生成
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

    // verificationテーブルにトークンを保存
    await db.insert(schema.verification).values({
      id: token, // トークンをIDとして使用
      identifier: session.user.id, // ユーザーID
      value: newEmail, // 新しいメールアドレス
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 確認メールを送信（開発環境ではコンソールに出力）
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email-change?token=${token}&email=${encodeURIComponent(newEmail)}&userId=${session.user.id}`;

    if (process.env.NODE_ENV === "development") {
      console.log("\n" + "=".repeat(80));
      console.log("📧 【PRO WORKS】メールアドレス変更の確認");
      console.log("=".repeat(80));
      console.log(`宛先: ${newEmail}`);
      console.log("");
      console.log("メールアドレスの変更を完了するには、以下のリンクをクリックしてください。");
      console.log("");
      console.log(`▶ ${verificationUrl}`);
      console.log("");
      console.log("※ このリンクの有効期限は1時間です。");
      console.log("※ このメールに心当たりがない場合は、削除してください。");
      console.log("=".repeat(80) + "\n");
    }

    // TODO: 本番環境ではResendを使用してメール送信

    console.log("✅ メールアドレス変更リクエスト成功:", session.user.email, "→", newEmail);

    return NextResponse.json(
      { message: "確認メールを送信しました" },
      { status: 200 }
    );
  } catch (error) {
    console.error("メールアドレス変更エラー:", error);
    return NextResponse.json(
      { error: "メールアドレス変更に失敗しました" },
      { status: 500 }
    );
  }
};

