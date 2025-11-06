import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone } from "lucide-react"

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/landing" className="text-2xl font-bold text-blue-600">
            PRO WORKS
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/landing">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            トップに戻る
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">企業情報</h1>

        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">会社概要</h2>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <dt className="font-semibold text-gray-700">会社名</dt>
              <dd className="md:col-span-2">株式会社PRO WORKS</dd>

              <dt className="font-semibold text-gray-700">設立</dt>
              <dd className="md:col-span-2">2020年4月1日</dd>

              <dt className="font-semibold text-gray-700">所在地</dt>
              <dd className="md:col-span-2">東京都渋谷区〇〇 1-2-3</dd>

              <dt className="font-semibold text-gray-700">事業内容</dt>
              <dd className="md:col-span-2">エンジニア向け案件マッチングサービスの運営</dd>
            </dl>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">お問い合わせ</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600" />
                <span>info@proworks.example.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <span>03-1234-5678</span>
              </div>
              <div className="pt-4">
                <Link href="/company/contact">
                  <Button>お問い合わせフォーム</Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
