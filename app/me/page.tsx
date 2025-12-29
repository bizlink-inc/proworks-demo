import { redirect } from "next/navigation"

// 統合ページにリダイレクト
export default function MyPage() {
  redirect("/?tab=profile")
}
