import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Briefcase, Users, TrendingUp } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ヘッダー */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/landing" className="text-2xl font-bold text-blue-600">
            PRO WORKS
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/media/career" className="text-gray-600 hover:text-blue-600">
              メディア
            </Link>
            <Link href="/company" className="text-gray-600 hover:text-blue-600">
              企業情報
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline">ログイン</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>新規登録</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          あなたのスキルを活かす
          <br />
          最適な案件を見つけよう
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          PRO WORKSは、エンジニアと企業をつなぐSESマッチングプラットフォームです。
          あなたに最適な案件を見つけて、キャリアを次のステージへ。
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-8">
              無料で始める <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/auth/signin">
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent">
              案件を探す
            </Button>
          </Link>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">PRO WORKSの特徴</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">豊富な案件</h3>
            <p className="text-gray-600">
              様々な業界・技術スタックの案件を多数掲載。あなたのスキルに合った案件が見つかります。
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">簡単マッチング</h3>
            <p className="text-gray-600">プロフィールを登録するだけで、あなたに最適な案件をAIがレコメンド。</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">キャリア支援</h3>
            <p className="text-gray-600">専門のキャリアアドバイザーがあなたのキャリアアップをサポートします。</p>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">今すぐ始めよう</h2>
          <p className="text-xl mb-8 opacity-90">無料登録で、あなたに最適な案件を見つけましょう</p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              無料で新規登録 <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">PRO WORKS</h3>
              <p className="text-sm">エンジニアのための案件マッチングプラットフォーム</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">メディア</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/media/career" className="hover:text-white">
                    キャリアとスキル
                  </Link>
                </li>
                <li>
                  <Link href="/media/business" className="hover:text-white">
                    ビジネス知識
                  </Link>
                </li>
                <li>
                  <Link href="/media/voice" className="hover:text-white">
                    みんなの声
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">サービス</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/auth/signin" className="hover:text-white">
                    案件を探す
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-white">
                    新規登録
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">企業情報</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/company" className="hover:text-white">
                    会社概要
                  </Link>
                </li>
                <li>
                  <Link href="/company/contact" className="hover:text-white">
                    お問い合わせ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 PRO WORKS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
