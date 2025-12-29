import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { updateApplicationStatus, clearApplicationsCache } from "@/lib/kintone/services/application";
import { createApplicationClient, getAppIds } from "@/lib/kintone/client";
import { APPLICATION_FIELDS } from "@/lib/kintone/fieldMapping";
import { sendApplicationCancelEmail } from "@/lib/email";
import { getTalentByAuthUserId } from "@/lib/kintone/services/talent";

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // paramsをawaitして取得
    const { id: applicationId } = await params;
    const body = await request.json();
    const { status } = body;

    // ステータスが指定されていない場合はエラー
    if (!status) {
      return NextResponse.json(
        { error: "ステータスが指定されていません" },
        { status: 400 }
      );
    }

    // 応募履歴DB（アプリID: 84）のクライアントを作成
    const client = createApplicationClient();
    const appId = getAppIds().application;

    // ユーザーが所有する応募履歴か確認（案件名も取得）
    const response = await client.record.getRecords({
      app: appId,
      query: `${APPLICATION_FIELDS.ID} = "${applicationId}" and ${APPLICATION_FIELDS.AUTH_USER_ID} = "${session.user.id}" limit 1`,
      fields: [APPLICATION_FIELDS.ID, APPLICATION_FIELDS.STATUS, APPLICATION_FIELDS.JOB_TITLE],
    });

    if (response.records.length === 0) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const application = response.records[0];
    const currentStatus = (application[APPLICATION_FIELDS.STATUS] as { value: string }).value;
    const jobTitle = (application[APPLICATION_FIELDS.JOB_TITLE] as { value: string }).value || "案件";

    // 応募取消しの場合、現在のステータスが「応募済み」でない場合は取り消し不可
    if (status === "応募取消し" && currentStatus !== "応募済み") {
      return NextResponse.json(
        { error: "この応募は取り消せません" },
        { status: 400 }
      );
    }

    // ステータスを更新（応募履歴DBのレコードIDを直接指定）
    await updateApplicationStatus(applicationId, status);

    // 応募キャッシュをクリア（応募一覧に即時反映するため）
    clearApplicationsCache();

    // 応募取消しの場合、メールを送信
    if (status === "応募取消し") {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://proworks.jp";
      const userEmail = session.user.email!;

      // ユーザー名を決定
      const talent = await getTalentByAuthUserId(session.user.id);
      let userName: string;
      if (talent?.lastName && talent?.firstName) {
        userName = `${talent.lastName} ${talent.firstName}`;
      } else if (talent?.fullName && talent.fullName.trim()) {
        userName = talent.fullName;
      } else if (session.user.name && session.user.name.trim()) {
        userName = session.user.name;
      } else {
        userName = "会員";
      }

      // メール送信は非同期で実行（レスポンスを待たない）
      sendApplicationCancelEmail(userEmail, userName, jobTitle, baseUrl)
        .then(() => console.log("✅ 応募取消しメール送信成功"))
        .catch((emailError) => console.error("⚠️ 応募取消しメール送信失敗:", emailError));
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("応募ステータスの更新に失敗:", error);
    return NextResponse.json(
      { error: "応募ステータスの更新に失敗しました" },
      { status: 500 }
    );
  }
};

