import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { NotificationProvider } from "@/lib/notification-context"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

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
      <body className={`font-sans antialiased`}>
        <NotificationProvider>
          {children}
          <Toaster />
          <Analytics />
        </NotificationProvider>
      </body>
    </html>
  )
}
