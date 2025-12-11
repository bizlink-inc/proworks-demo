import { auth, type Session } from "./auth";
import { headers } from "next/headers";

export const getSession = async (): Promise<Session | null> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session as Session | null;
  } catch (error) {
    console.error("セッション取得エラー:", error);
    return null;
  }
};

export const requireAuth = async (): Promise<Session> => {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
};
