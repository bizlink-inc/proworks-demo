import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"
import { MyPageClient } from "@/components/mypage-client"

export default async function MyPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  return <MyPageClient user={session} />
}
