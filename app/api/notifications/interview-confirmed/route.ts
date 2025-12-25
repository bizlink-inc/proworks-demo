/**
 * 面談予定確定通知API
 * POST /api/notifications/interview-confirmed
 *
 * ステータスが「面談予定」に変更された際にメールを送信する
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { sendInterviewConfirmedEmail } from "@/lib/email";
import { headers } from "next/headers";

export const POST = async (request: NextRequest) => {
  console.log("📧 [面談予定確定] API呼び出し開始");

  try {
    // 認証チェック
    const session = await getSession();
    if (!session?.user?.id) {
      console.log("📧 [面談予定確定] 認証エラー: セッションなし");
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // リクエストボディから案件情報を取得
    const body = await request.json();
    const { jobTitle, jobId } = body;
    console.log(`📧 [面談予定確定] 案件情報: jobId=${jobId}, jobTitle=${jobTitle}`);

    if (!jobTitle || !jobId) {
      console.log("📧 [面談予定確定] エラー: 案件情報が不足");
      return NextResponse.json(
        { error: "案件情報が必要です" },
        { status: 400 }
      );
    }

    // ユーザー情報を取得
    const userEmail = session.user.email;
    const userName = session.user.name || userEmail?.split("@")[0] || "ユーザー";
    console.log(`📧 [面談予定確定] ユーザー: ${userName} <${userEmail}>`);

    if (!userEmail) {
      console.log("📧 [面談予定確定] エラー: メールアドレスなし");
      return NextResponse.json(
        { error: "メールアドレスが設定されていません" },
        { status: 400 }
      );
    }

    // baseURLを取得
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    console.log(`📧 [面談予定確定] メール送信開始...`);

    // メール送信
    const result = await sendInterviewConfirmedEmail(
      userEmail,
      userName,
      jobTitle,
      baseUrl
    );

    if (!result.success) {
      console.error("📧 [面談予定確定] メール送信エラー:", result.error);
      return NextResponse.json(
        { error: "メール送信に失敗しました" },
        { status: 500 }
      );
    }

    console.log(`📧 [面談予定確定] メール送信成功!`);

    return NextResponse.json({
      success: true,
      message: "面談予定確定メールを送信しました",
      jobId,
    });

  } catch (error) {
    console.error("面談予定確定通知エラー:", error);
    return NextResponse.json(
      { error: "通知の送信に失敗しました" },
      { status: 500 }
    );
  }
};
