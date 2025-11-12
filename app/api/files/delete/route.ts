import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getTalentByAuthUserId, updateTalent } from "@/lib/kintone/services/talent";

export const DELETE = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // URLパラメータからfileKeyを取得
    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get("fileKey");

    if (!fileKey) {
      return NextResponse.json(
        { error: "fileKeyが指定されていません" },
        { status: 400 }
      );
    }

    console.log("🗑️ ファイル削除開始:", {
      fileKey,
      userId: session.user.id,
    });

    // 現在の人材情報を取得
    const talent = await getTalentByAuthUserId(session.user.id);
    
    if (!talent) {
      return NextResponse.json(
        { error: "人材情報が見つかりません" },
        { status: 404 }
      );
    }

    // 指定されたfileKeyのファイルを除外
    const updatedResumeFiles = talent.resumeFiles.filter(
      file => file.fileKey !== fileKey
    );

    // 人材情報を更新（ファイルリストから削除）
    await updateTalent(talent.id, {
      resumeFiles: updatedResumeFiles,
    });

    console.log("✅ ファイル削除成功:", {
      fileKey,
      remainingFiles: updatedResumeFiles.length,
      userId: session.user.id,
    });

    return NextResponse.json({
      message: "ファイルが削除されました",
      remainingFiles: updatedResumeFiles,
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ ファイル削除エラー:", error);
    
    let errorMessage = "ファイルの削除に失敗しました。";
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
};
