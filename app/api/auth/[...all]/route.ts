import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

// better-auth ハンドラーを事前に作成
const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

export const GET = async (request: NextRequest) => {
  return authGET(request);
};

export const POST = async (request: NextRequest) => {
  try {
    const response = await authPOST(request);

    // レスポンスがエラーの場合、本文を確認
    if (!response.ok) {
      const clonedResponse = response.clone();
      try {
        const body = await clonedResponse.json();
        // 退会済みユーザーのエラーメッセージを確認
        if (body?.message?.includes("退会済み") || body?.error?.message?.includes("退会済み")) {
          return NextResponse.json(
            { message: "すでに退会済みのアカウントです。再度ご利用いただく場合は新規登録をお願いいたします。" },
            { status: 403 }
          );
        }
      } catch {
        // JSONパースに失敗した場合は元のレスポンスを返す
      }
    }

    return response;
  } catch (error) {
    // エラーがthrowされた場合（databaseHooksからのエラー）
    if (error instanceof Error && error.message.includes("退会済み")) {
      return NextResponse.json(
        { message: "すでに退会済みのアカウントです。再度ご利用いただく場合は新規登録をお願いいたします。" },
        { status: 403 }
      );
    }
    // その他のエラーは再スロー
    throw error;
  }
};
