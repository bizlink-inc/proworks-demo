import { NextRequest, NextResponse } from "next/server";
import { createTalent } from "@/lib/kintone/services/talent";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { 
      authUserId, 
      lastName, 
      firstName, 
      email, 
      phone, 
      birthDate,
      emailDeliveryStatus,
      termsAgreed,
    } = body;

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
      emailDeliveryStatus,
      termsAgreed,
    });

    return NextResponse.json({ id: recordId }, { status: 201 });
  } catch (error) {
    console.error("人材情報の作成に失敗:", error);
    console.error("エラー詳細:", JSON.stringify(error, null, 2));
    
    // エラーオブジェクトの詳細情報を取得
    const errorMessage = error instanceof Error ? error.message : "不明なエラー";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("エラーメッセージ:", errorMessage);
    if (errorStack) {
      console.error("スタックトレース:", errorStack);
    }
    
    return NextResponse.json(
      { 
        error: "人材情報の作成に失敗しました",
        message: errorMessage,
        details: error
      },
      { status: 500 }
    );
  }
};

