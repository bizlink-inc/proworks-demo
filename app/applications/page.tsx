import { redirect } from "next/navigation"

// 統合ページにリダイレクト
export default function ApplicationsPage() {
  redirect("/?tab=applications")
}
