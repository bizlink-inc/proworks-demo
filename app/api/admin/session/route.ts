/**
 * 管理者セッション確認API
 * GET /api/admin/session
 */

import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";

export const GET = async () => {
  try {
    const isAuthenticated = await verifyAdminSession();
    return NextResponse.json({ authenticated: isAuthenticated });
  } catch (error) {
    console.error("セッション確認エラー:", error);
    return NextResponse.json({ authenticated: false });
  }
};

