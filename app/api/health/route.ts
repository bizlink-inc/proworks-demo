/**
 * ヘルスチェックエンドポイント
 * GET /api/health
 * 
 * App Runnerのヘルスチェック用エンドポイント
 */

import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "ProWorks API",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ヘルスチェックエラー:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

