import { NextRequest, NextResponse } from "next/server";
import { getJobById } from "@/lib/kintone/services/job";

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    // kintoneから案件詳細を取得
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ error: "案件が見つかりません" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("案件詳細の取得に失敗:", error);
    return NextResponse.json(
      { error: "案件詳細の取得に失敗しました" },
      { status: 500 }
    );
  }
};
