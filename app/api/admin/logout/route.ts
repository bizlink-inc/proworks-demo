/**
 * 管理者ログアウトAPI
 * POST /api/admin/logout
 */

import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/admin-auth";

export const POST = async () => {
  try {
    await destroyAdminSession();
    return NextResponse.json({ success: true, message: "ログアウト成功" });
  } catch (error) {
    console.error("管理者ログアウトエラー:", error);
    return NextResponse.json(
      { error: "ログアウト処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
};

