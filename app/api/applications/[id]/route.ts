import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { updateApplicationStatus } from "@/lib/kintone/services/application";
import { createApplicationClient, getAppIds } from "@/lib/kintone/client";
import { APPLICATION_FIELDS } from "@/lib/kintone/fieldMapping";

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

    // ユーザーが所有する応募履歴か確認（応募取り消しを含む全件を取得するため、直接クエリを実行）
    const records = await client.record.getAllRecords({
      app: appId,
      condition: `${APPLICATION_FIELDS.AUTH_USER_ID} = "${session.user.id}"`,
    });

    // レコードIDで応募履歴を検索（文字列と数値の両方に対応）
    const application = records.find((record: any) => {
      const recordId = record[APPLICATION_FIELDS.ID].value;
      // 文字列として比較、または数値として比較
      return String(recordId) === String(applicationId) || recordId === applicationId;
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const currentStatus = application[APPLICATION_FIELDS.STATUS].value;

    // 応募取消しの場合、現在のステータスが「応募済み」でない場合は取り消し不可
    if (status === "応募取消し" && currentStatus !== "応募済み") {
      return NextResponse.json(
        { error: "この応募は取り消せません" },
        { status: 400 }
      );
    }

    // ステータスを更新（応募履歴DBのレコードIDを直接指定）
    await updateApplicationStatus(applicationId, status);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("応募ステータスの更新に失敗:", error);
    return NextResponse.json(
      { error: "応募ステータスの更新に失敗しました" },
      { status: 500 }
    );
  }
};

