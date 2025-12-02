import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

// Vercel 環境では機能しない
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

export const POST = async (request: NextRequest) => {
  // Vercel 環境では機能しないことを返す
  if (isVercel) {
    return NextResponse.json(
      { error: "この機能はデモ環境では利用できません" },
      { status: 503 }
    );
  }

  try {
    const { getSession } = await import("@/lib/auth-server");
    const db = getDb();

    const session = await getSession();
    console.log("🔍 メールアドレス変更リクエスト - セッション:", session?.user?.email, session?.user?.id);

    if (!session?.user?.id || !session?.user?.email) {
      console.log("❌ セッションが見つかりません");
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newEmail } = body;
    console.log("🔍 リクエストボディ:", { hasPassword: !!currentPassword, newEmail });

    if (!currentPassword || !newEmail) {
      console.log("❌ 入力値が不足しています");
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
    const existingUser = await db.select().from(schema.user).where(eq(schema.user.email, newEmail)).then(rows => rows[0]);

    if (existingUser) {
      return NextResponse.json(
        { error: "このメールアドレスは既に使用されています" },
        { status: 400 }
      );
    }

    // Better Authでパスワードを検証
    console.log("🔍 パスワード検証開始:", session.user.email);
    
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const testLoginResponse = await fetch(`${appUrl}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          password: currentPassword,
        }),
      });

      const testLoginData = await testLoginResponse.json();
      
      if (!testLoginResponse.ok || !testLoginData.user) {
        console.log("❌ パスワード検証失敗");
        return NextResponse.json(
          { error: "現在のパスワードが正しくありません" },
          { status: 400 }
        );
      }
      
      console.log("✅ パスワード検証成功");
    } catch (passwordCheckError) {
      console.error("パスワード検証エラー:", passwordCheckError);
      return NextResponse.json(
        { error: "パスワード検証に失敗しました" },
        { status: 500 }
      );
    }

    // トークンを生成
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

    // verificationテーブルにトークンを保存
    await db.insert(schema.verification).values({
      id: token,
      identifier: session.user.id,
      value: newEmail,
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
