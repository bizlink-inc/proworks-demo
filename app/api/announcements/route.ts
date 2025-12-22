import { NextResponse } from "next/server";
import { getAnnouncements } from "@/lib/kintone/services/announcement";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const announcements = await getAnnouncements();
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("お知らせAPIエラー:", error);
    return NextResponse.json(
      { error: "お知らせの取得に失敗しました" },
      { status: 500 }
    );
  }
}

