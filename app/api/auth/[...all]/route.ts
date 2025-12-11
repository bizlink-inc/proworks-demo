import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

// better-auth ハンドラーを事前に作成
const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

export const GET = async (request: NextRequest) => {
  return authGET(request);
};

export const POST = async (request: NextRequest) => {
  return authPOST(request);
};
