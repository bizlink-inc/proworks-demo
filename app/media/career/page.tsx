import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function CareerPage() {
  const articles = [
    {
      id: 1,
      title: "エンジニアのキャリアパスを考える",
      excerpt: "技術者としてのキャリアをどう築いていくか、様々な選択肢を紹介します。",
      date: "2025-01-15",
    },
    {
      id: 2,
      title: "需要の高いプログラミング言語トップ10",
      excerpt: "2025年に注目すべきプログラミング言語とその活用シーンを解説します。",
      date: "2025-01-10",
    },
    {
      id: 3,
      title: "フリーランスエンジニアとして成功するために",
      excerpt: "独立を考えているエンジニアに向けた実践的なアドバイスをお届けします。",
      date: "2025-01-05",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/auth/signin" className="text-2xl font-bold text-blue-600">
            PRO WORKS
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Link href="/auth/signin">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            トップに戻る
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-2">キャリアとスキル</h1>
        <p className="text-gray-600 mb-8">エンジニアのキャリア形成とスキルアップに関する情報をお届けします</p>

        <div className="grid gap-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <time className="text-sm text-gray-500">{article.date}</time>
              <h2 className="text-2xl font-semibold mt-2 mb-3">{article.title}</h2>
              <p className="text-gray-600 mb-4">{article.excerpt}</p>
              <Button variant="link" className="p-0">
                続きを読む →
              </Button>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}
