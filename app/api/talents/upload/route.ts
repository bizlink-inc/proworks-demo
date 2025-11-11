import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getTalentByAuthUserId, uploadResumeFile, updateResumeFiles } from "@/lib/kintone/services/talent";

export const POST = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // kintoneから人材情報を取得
    const talent = await getTalentByAuthUserId(session.user.id);

    if (!talent) {
      return NextResponse.json({ error: "Talent not found" }, { status: 404 });
    }

    // フォームデータからファイルを取得
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File not provided" }, { status: 400 });
    }

    // kintoneにファイルをアップロード
    const fileKey = await uploadResumeFile(file);

    // 人材レコードに添付ファイルを更新
    await updateResumeFiles(talent.id, [fileKey]);

    return NextResponse.json(
      {
        success: true,
        fileKey,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ファイルのアップロードに失敗:", error);
    return NextResponse.json(
      { error: "ファイルのアップロードに失敗しました" },
      { status: 500 }
    );
  }
};

