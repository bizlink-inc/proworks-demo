import { NextResponse } from "next/server";
import { clearJobCache } from "@/lib/kintone/services/job";

/**
 * 開発用：メモリキャッシュをクリアするAPI
 * GET /api/dev/clear-cache
 */
export const GET = async () => {
  // 本番環境では無効化
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is disabled in production" },
      { status: 403 }
    );
  }

  try {
    // 案件キャッシュをクリア（応募データはキャッシュなし）
    clearJobCache();

    return NextResponse.json({
      success: true,
      message: "Job cache cleared",
      clearedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cache clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    );
  }
};
