"use client"

import { useEffect, useState } from "react"

const STORAGE_KEYS = [
  "notifications",
  "seed_notification_initialized",
  "read_recommended_notifications",
  "previous_application_status",
]

export default function ClearCachePage() {
  const [cleared, setCleared] = useState(false)
  const [clearedKeys, setClearedKeys] = useState<string[]>([])

  useEffect(() => {
    const keys: string[] = []

    STORAGE_KEYS.forEach((key) => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key)
        keys.push(key)
      }
    })

    setClearedKeys(keys)
    setCleared(true)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">
          {cleared ? "Cache Cleared" : "Clearing..."}
        </h1>

        {cleared && (
          <>
            {clearedKeys.length > 0 ? (
              <>
                <p className="text-green-600 mb-4">以下のキーをクリアしました:</p>
                <ul className="list-disc list-inside mb-4 text-sm text-gray-600">
                  {clearedKeys.map((key) => (
                    <li key={key}>{key}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-gray-600 mb-4">クリアするキャッシュはありませんでした。</p>
            )}

            <a
              href="/"
              className="block w-full text-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
            >
              トップページへ戻る
            </a>
          </>
        )}
      </div>
    </div>
  )
}
