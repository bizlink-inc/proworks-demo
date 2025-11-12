import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { downloadFileFromKintone } from "@/lib/kintone/services/file";

export const GET = async (request: NextRequest) => {
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

    console.log("📥 ファイルダウンロード開始:", {
      fileKey,
      userId: session.user.id,
    });

    // kintoneからファイルをダウンロード
    const { blob, fileName } = await downloadFileFromKintone(fileKey);

    console.log("✅ ファイルダウンロード成功:", {
      fileKey,
      fileName,
      userId: session.user.id,
    });

    // BlobをArrayBufferに変換
    const arrayBuffer = await blob.arrayBuffer();

    // ファイルをレスポンスとして返す
    const response = new NextResponse(arrayBuffer);
    
    // Content-Dispositionヘッダーを設定してダウンロードを促す
    response.headers.set(
      'Content-Disposition', 
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    
    // Content-Typeを設定
    response.headers.set('Content-Type', blob.type || 'application/octet-stream');
    
    return response;

  } catch (error: any) {
    console.error("❌ ファイルダウンロードエラー:", error);
    
    let errorMessage = "ファイルのダウンロードに失敗しました。";
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
};
