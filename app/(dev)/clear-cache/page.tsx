"use client"

import { useEffect, useState } from "react"

const STORAGE_KEYS = [
  "notifications",
  "seed_notification_initialized",
  "read_recommended_notifications",
  "previous_application_status",
  "profile_notification_dismissed_at",
]

export default function ClearCachePage() {
  const [cleared, setCleared] = useState(false)
  const [clearedKeys, setClearedKeys] = useState<string[]>([])
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    const keys: string[] = []

    // 1. localStorage のキャッシュをクリア
    STORAGE_KEYS.forEach((key) => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key)
        keys.push(key)
      }
    })

    // 2. sessionStorage もクリア（念のため）
    try {
      sessionStorage.clear()
      keys.push("sessionStorage (all)")
    } catch {
      // sessionStorage がない環境でも続行
    }

    setClearedKeys(keys)
    setCleared(true)
  }, [])

  const handleRedirect = () => {
    setRedirecting(true)
    // キャッシュバスティング用のタイムスタンプを付けてリダイレクト
    // これにより、ブラウザキャッシュを回避して最新のページを取得
    window.location.href = `/?_cache_bust=${Date.now()}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">
          {redirecting ? "リダイレクト中..." : cleared ? "Cache Cleared" : "Clearing..."}
        </h1>

        {cleared && !redirecting && (
          <>
            {clearedKeys.length > 0 ? (
              <>
                <p className="text-green-600 mb-4">以下のキャッシュをクリアしました:</p>
                <ul className="list-disc list-inside mb-4 text-sm text-gray-600">
                  {clearedKeys.map((key) => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-gray-600 mb-4">クリアするキャッシュはありませんでした。</p>
            )}

            <p className="text-sm text-gray-500 mb-4">
              ※ブラウザのHTTPキャッシュもクリアするため、下のボタンをクリックしてください。
            </p>

            <button
              onClick={handleRedirect}
              className="block w-full text-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors cursor-pointer"
            >
              キャッシュをクリアしてトップページへ
            </button>
          </>
        )}
      </div>
    </div>
  )
}
