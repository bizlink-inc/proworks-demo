import type React from "react"
import type { Metadata } from "next"
import { Noto_Sans_JP } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "@/lib/notification-context"
import "./globals.css"

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
})

export const metadata: Metadata = {
  title: "PRO WORKS - SESマッチングプラットフォーム",
  description: "エンジニア向け案件マッチングサービス",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        <NotificationProvider>
          {children}
          <Toaster />
          <Analytics />
        </NotificationProvider>
      </body>
    </html>
  )
}
