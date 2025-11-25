/**
 * 管理者ログインAPI
 * POST /api/admin/login
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, createAdminSession } from "@/lib/admin-auth";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "メールアドレスとパスワードを入力してください" },
        { status: 400 }
      );
    }

    const isValid = verifyAdminCredentials(email, password);

    if (!isValid) {
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        { status: 401 }
      );
    }

    // セッションを作成
    await createAdminSession();

    return NextResponse.json({ success: true, message: "ログイン成功" });
  } catch (error) {
    console.error("管理者ログインエラー:", error);
    return NextResponse.json(
      { error: "ログイン処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
};

