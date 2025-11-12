import { NextResponse } from "next/server";
import { getAllJobs } from "@/lib/kintone/services/job";

export const GET = async () => {
  try {
    // kintoneからすべての案件を取得
    const jobs = await getAllJobs();

    return NextResponse.json({
      items: jobs,
      total: jobs.length,
    });
  } catch (error) {
    console.error("案件一覧の取得に失敗:", error);
    return NextResponse.json(
      { error: "案件一覧の取得に失敗しました" },
      { status: 500 }
    );
}
};
