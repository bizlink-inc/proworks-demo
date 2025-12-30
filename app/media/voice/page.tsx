import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function VoicePage() {
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

        <h1 className="text-4xl font-bold mb-2">みんなの声</h1>
        <p className="text-gray-600 mb-8">PRO WORKSを利用しているエンジニアの体験談</p>

        <div className="text-center py-12">
          <p className="text-gray-500">コンテンツは準備中です</p>
        </div>
      </main>
    </div>
  )
}
