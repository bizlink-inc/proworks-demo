import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { getTalentByAuthUserId, updateTalent } from "@/lib/kintone/services/talent";

export const GET = async () => {
  try {
    const session = await getSession();
    console.log("Session:", session);

    if (!session?.user?.id) {
      console.log("Unauthorized: No session or user id");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching talent for auth_user_id:", session.user.id);

    // kintoneから人材情報を取得
    const talent = await getTalentByAuthUserId(session.user.id);
    console.log("Talent data:", talent);

    if (!talent) {
      console.log("Talent not found for user:", session.user.id);
      return NextResponse.json({ error: "Talent not found" }, { status: 404 });
    }

    // 退会済みユーザーのチェック
    if (talent.st === "退会") {
      console.log("Withdrawn user attempted to access:", session.user.id);
      return NextResponse.json(
        { error: "このアカウントは退会済みです", withdrawn: true },
        { status: 403 }
      );
    }

    return NextResponse.json(talent);
  } catch (error) {
    console.error("人材情報の取得に失敗:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "人材情報の取得に失敗しました" },
      { status: 500 }
    );
}
};

export const PATCH = async (request: NextRequest) => {
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

    const body = await request.json();

    // kintoneの人材情報を更新
    await updateTalent(talent.id, body);

    // 更新後のデータを取得
    const updatedTalent = await getTalentByAuthUserId(session.user.id);

    return NextResponse.json(updatedTalent);
  } catch (error) {
    console.error("人材情報の更新に失敗:", error);
    return NextResponse.json(
      { error: "人材情報の更新に失敗しました" },
      { status: 500 }
    );
}
};
