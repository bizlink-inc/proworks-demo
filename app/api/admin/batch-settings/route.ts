/**
 * バッチ設定API
 * GET /api/admin/batch-settings - 設定を取得
 * POST /api/admin/batch-settings - 設定を更新
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { getDb, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";

const DEFAULT_SETTINGS = {
  id: "default",
  scoreThreshold: 3,
  maxPerJob: 50,
};

/**
 * 設定を取得
 */
export const GET = async () => {
  try {
    // 認証チェック
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const db = getDb();

    // 設定を取得
    const settings = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.id, "default"))
      .limit(1);

    if (settings.length === 0) {
      // 設定が存在しない場合はデフォルト値を返す
      return NextResponse.json({
        scoreThreshold: DEFAULT_SETTINGS.scoreThreshold,
        maxPerJob: DEFAULT_SETTINGS.maxPerJob,
      });
    }

    return NextResponse.json({
      scoreThreshold: settings[0].scoreThreshold,
      maxPerJob: settings[0].maxPerJob,
    });
  } catch (error) {
    console.error("設定取得エラー:", error);
    return NextResponse.json(
      { error: "設定の取得に失敗しました" },
      { status: 500 }
    );
  }
};

/**
 * 設定を更新
 */
export const POST = async (request: NextRequest) => {
  try {
    // 認証チェック
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const { scoreThreshold, maxPerJob } = body;

    // バリデーション
    if (typeof scoreThreshold !== "number" || scoreThreshold < 0 || scoreThreshold > 20) {
      return NextResponse.json(
        { error: "スコア閾値は0〜20の範囲で指定してください" },
        { status: 400 }
      );
    }

    if (maxPerJob !== undefined && (typeof maxPerJob !== "number" || maxPerJob < 1 || maxPerJob > 200)) {
      return NextResponse.json(
        { error: "1案件あたりの最大数は1〜200の範囲で指定してください" },
        { status: 400 }
      );
    }

    const db = getDb();

    // 既存の設定を確認
    const existing = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.id, "default"))
      .limit(1);

    if (existing.length === 0) {
      // 新規作成
      await db.insert(schema.appSettings).values({
        id: "default",
        scoreThreshold,
        maxPerJob: maxPerJob ?? DEFAULT_SETTINGS.maxPerJob,
        updatedAt: new Date(),
      });
    } else {
      // 更新
      await db
        .update(schema.appSettings)
        .set({
          scoreThreshold,
          maxPerJob: maxPerJob ?? existing[0].maxPerJob,
          updatedAt: new Date(),
        })
        .where(eq(schema.appSettings.id, "default"));
    }

    return NextResponse.json({
      success: true,
      scoreThreshold,
      maxPerJob: maxPerJob ?? existing[0]?.maxPerJob ?? DEFAULT_SETTINGS.maxPerJob,
    });
  } catch (error) {
    console.error("設定更新エラー:", error);
    return NextResponse.json(
      { error: "設定の更新に失敗しました" },
      { status: 500 }
    );
  }
};
