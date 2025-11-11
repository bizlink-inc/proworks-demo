import { NextRequest, NextResponse } from "next/server";
import { createTalent } from "@/lib/kintone/services/talent";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { authUserId, lastName, firstName, email, phone, birthDate } = body;

    // バリデーション
    if (!authUserId || !lastName || !firstName || !email || !phone || !birthDate) {
      return NextResponse.json(
        { error: "必須項目が不足しています" },
        { status: 400 }
      );
    }

    // kintoneに人材情報を作成
    const recordId = await createTalent({
      authUserId,
      lastName,
      firstName,
      email,
      phone,
      birthDate,
    });

    return NextResponse.json({ id: recordId }, { status: 201 });
  } catch (error) {
    console.error("人材情報の作成に失敗:", error);
    return NextResponse.json(
      { error: "人材情報の作成に失敗しました" },
      { status: 500 }
    );
  }
};

