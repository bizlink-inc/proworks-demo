import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"
import { MyPageClient } from "@/components/mypage-client"
import { getTalentProfile } from "@/lib/server/talent"

export default async function MyPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  // サーバーサイドでユーザーデータを事前取得（SSR）
  // これによりクライアント側でのAPI呼び出しを削減し、初期表示を高速化
  let initialTalent = null
  try {
    initialTalent = await getTalentProfile(session.user.id)
  } catch (error) {
    console.error("サーバーサイドでのタレントデータ取得に失敗:", error)
    // エラー時はクライアント側でフォールバック取得
  }

  return (
    <MyPageClient
      user={session.user}
      initialTalent={initialTalent}
    />
  )
}
