import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { updateApplicationStatus } from "@/lib/kintone/services/application";
import { createApplicationClient, getAppIds } from "@/lib/kintone/client";
import { APPLICATION_FIELDS } from "@/lib/kintone/fieldMapping";

export const PATCH = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applicationId = params.id;
    const body = await request.json();
    const { status } = body;

    // ステータスが指定されていない場合はエラー
    if (!status) {
      return NextResponse.json(
        { error: "ステータスが指定されていません" },
        { status: 400 }
      );
    }

    // ユーザーが所有する応募履歴か確認（応募取り消しを含む全件を取得するため、直接クエリを実行）
    const client = createApplicationClient();
    const appId = getAppIds().application;

    const response = await client.record.getRecords({
      app: appId,
      query: `${APPLICATION_FIELDS.AUTH_USER_ID} = "${session.user.id}"`,
    });

    const application = response.records.find(
      (record: any) => record[APPLICATION_FIELDS.ID].value === applicationId
    );

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const currentStatus = application[APPLICATION_FIELDS.STATUS].value;

    // 応募ステータスが「応募済み」でない場合は取り消し不可
    if (currentStatus !== "応募済み") {
      return NextResponse.json(
        { error: "この応募は取り消せません" },
        { status: 400 }
      );
    }

    // ステータスを更新
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

