import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { uploadFileToKintone } from "@/lib/kintone/services/file";

export const POST = async (request: NextRequest) => {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    // FormDataからファイルを取得
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    console.log("📤 ファイルアップロード開始:", {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
      userId: session.user.id,
    });

    // ファイル形式チェック
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    ];
    
    // 拡張子でもチェック（MIME Typeが正しく設定されていない場合に備える）
    const allowedExtensions = ['.pdf', '.docx', '.xlsx'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "対応していないファイル形式です。PDF、Word (.docx)、Excel (.xlsx) 形式のファイルをアップロードしてください。" },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "ファイルサイズが10MBを超えています。" },
        { status: 400 }
      );
    }

    // kintoneにファイルをアップロード
    const uploadResult = await uploadFileToKintone(file);

    console.log("✅ ファイルアップロード成功:", {
      fileKey: uploadResult.fileKey,
      fileName: uploadResult.fileName,
      userId: session.user.id,
    });

    return NextResponse.json({
      fileKey: uploadResult.fileKey,
      fileName: uploadResult.fileName,
      fileSize: uploadResult.fileSize,
      contentType: uploadResult.contentType,
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ ファイルアップロードエラー:", error);
    
    let errorMessage = "ファイルのアップロードに失敗しました。";
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
};
