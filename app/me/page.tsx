import { redirect } from "next/navigation"

// 統合ページにリダイレクト（案件一覧をデフォルトで表示）
export default function MyPage() {
  redirect("/")
}
