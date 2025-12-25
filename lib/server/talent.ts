/**
 * サーバーサイド用のタレント（ユーザー）データ取得関数
 * APIルートを経由せず直接Kintoneからデータを取得することで、
 * HTTPラウンドトリップのオーバーヘッドを削減
 */

import { getTalentByAuthUserId } from "@/lib/kintone/services/talent";
import type { Talent } from "@/lib/kintone/types";

/**
 * 認証ユーザーのプロフィール情報を取得（サーバーサイド用）
 */
export async function getTalentProfile(authUserId: string): Promise<Talent | null> {
  try {
    const talent = await getTalentByAuthUserId(authUserId);
    return talent;
  } catch (error) {
    console.error("タレント情報取得エラー:", error);
    return null;
  }
}
