import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function BusinessPage() {
  const articles = [
    {
      id: 1,
      title: "IT業界のビジネスモデルを理解する",
      excerpt: "SES、受託開発、自社サービスなど、IT業界の様々なビジネスモデルを解説します。",
      date: "2025-01-12",
    },
    {
      id: 2,
      title: "プロジェクトマネジメントの基礎",
      excerpt: "エンジニアが知っておくべきプロジェクト管理の基本を学びましょう。",
      date: "2025-01-08",
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

        <h1 className="text-4xl font-bold mb-2">ビジネス知識</h1>
        <p className="text-gray-600 mb-8">IT業界のビジネスに関する知識を深めましょう</p>

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
