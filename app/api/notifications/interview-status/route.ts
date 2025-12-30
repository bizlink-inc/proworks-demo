/**
 * 面談予定ステータス通知API
 *
 * GET /api/notifications/interview-status
 * - 未通知の面談予定（ステータスが「面談予定」かつ通知日時が空）を取得
 *
 * POST /api/notifications/interview-status
 * - 通知済みとしてマーク（面談予定通知日時を更新）
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import {
  getUnnotifiedInterviewApplications,
  markInterviewNotified,
} from "@/lib/kintone/services/application";
import type { StatusChangeNotification } from "@/lib/notification-context";

// GET: 未通知の面談予定を取得
export const GET = async () => {
  try {
    // 認証チェック
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const authUserId = session.user.id;

    // 未通知の面談予定を取得
    const applications = await getUnnotifiedInterviewApplications(authUserId);

    // 通知データに変換
    const notifications: StatusChangeNotification[] = applications.map((app) => ({
      id: `interview-status-${app.id}`,
      type: "status_change" as const,
      jobId: app.jobId,
      jobTitle: app.jobTitle,
      oldStatus: "面談調整中",
      newStatus: "面談予定",
      timestamp: app.appliedAt,
    }));

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error("面談予定通知取得エラー:", error);
    return NextResponse.json(
      { error: "面談予定通知の取得に失敗しました" },
      { status: 500 }
    );
  }
};

// POST: 通知済みとしてマーク
export const POST = async (request: NextRequest) => {
  try {
    // 認証チェック
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // リクエストボディから応募IDを取得
    const body = await request.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json(
        { error: "応募IDが必要です" },
        { status: 400 }
      );
    }

    // 通知済みとしてマーク
    await markInterviewNotified(applicationId);

    return NextResponse.json({
      success: true,
      message: "面談予定通知を既読としてマークしました",
    });

  } catch (error) {
    console.error("面談予定通知マークエラー:", error);
    return NextResponse.json(
      { error: "面談予定通知のマークに失敗しました" },
      { status: 500 }
    );
  }
};
