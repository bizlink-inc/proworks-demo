"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

const ANNOUNCEMENT_STORAGE_KEY_PREFIX = "proworks_announcement_dismissed_"

type Announcement = {
  id: string
  type: string
  startDate: string
  endDate: string
  content: string
}

// 日付をフォーマットする関数（yyyy-MM-dd -> M/d(曜日)）
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"]
  const weekday = weekdays[date.getDay()]
  return `${month}/${day}(${weekday})`
}

export const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isClosing, setIsClosing] = useState(false) // 閉じるアニメーション中かどうか
  const [isAnimating, setIsAnimating] = useState(false) // アニメーション中かどうか
  const [totalCount, setTotalCount] = useState(0) // 初期の全件数（変更しない）
  const [currentIndex, setCurrentIndex] = useState(1) // 現在表示中の位置（1件目から開始）

  useEffect(() => {
    // 開発用: Cookieからキャッシュクリアフラグをチェック
    const clearCacheFlag = document.cookie
      .split("; ")
      .find((row) => row.startsWith("clear_announcement_cache="))
      ?.split("=")[1];

    if (clearCacheFlag === "true") {
      // ローカルストレージからお知らせのキャッシュをクリア
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(ANNOUNCEMENT_STORAGE_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Cookieを削除
      document.cookie = "clear_announcement_cache=; max-age=0; path=/";
    }

    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcements")
        if (!response.ok) {
          return
        }

        const data = await response.json()

        if (data.announcements && Array.isArray(data.announcements)) {
          // ローカルストレージをチェックして、閉じられていないお知らせのみフィルタリング
          const visible = data.announcements.filter((announcement: Announcement) => {
            const dismissed = localStorage.getItem(`${ANNOUNCEMENT_STORAGE_KEY_PREFIX}${announcement.id}`)
            return !dismissed
          })

          setAnnouncements(visible)
          setTotalCount(visible.length) // 初期の全件数を設定
          setCurrentIndex(1) // 最初は1件目から開始
        }
      } catch (error) {
        console.error("お知らせの取得に失敗:", error)
      }
    }

    fetchAnnouncements()
  }, [])

  const handleClose = (announcementId: string) => {
    // アニメーション中は何もしない
    if (isAnimating) {
      return
    }

    // ローカルストレージに閉じたことを保存（二度と表示されないようにする）
    localStorage.setItem(`${ANNOUNCEMENT_STORAGE_KEY_PREFIX}${announcementId}`, "true")

    // 現在表示しているお知らせをリストから削除
    const updatedAnnouncements = announcements.filter((a) => a.id !== announcementId)

    // 現在の位置をインクリメント（次のお知らせの位置）
    const nextIndex = currentIndex + 1
    
    // フェードアウトアニメーション開始
    setIsClosing(true)
    setIsAnimating(true)
    
    // フェードアウト完了後、リストを更新してフェードイン
    setTimeout(() => {
      setAnnouncements(updatedAnnouncements)
      setCurrentIndex(nextIndex) // 次の位置に更新
      setIsClosing(false)
      
      // 次のお知らせがある場合、フェードインアニメーション
      if (updatedAnnouncements.length > 0) {
        setTimeout(() => {
          setIsAnimating(false)
        }, 50) // 少し遅延を入れてフェードインを開始
      } else {
        setIsAnimating(false)
      }
    }, 300) // フェードアウトの時間（300ms）
  }

  // 表示するお知らせがない場合は何も表示しない
  if (announcements.length === 0) {
    return null
  }

  // 現在表示するお知らせ（1件ずつ表示、常に最初の1件）
  // お知らせが2件ある場合：最初は1件目を表示 → ×を押す → 2件目が表示される
  const displayAnnouncement = announcements[0]

  return (
    <div
      className="w-full py-3 px-6 flex items-center gap-4 relative overflow-hidden"
      style={{
        backgroundColor: "var(--pw-bg-pink-lighter)",
        opacity: isClosing ? 0 : 1,
        transform: isClosing ? "translateY(-10px)" : "translateY(0)",
        transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
      }}
    >
      {/* 左側: 種別タグ */}
      <div
        className="px-3 py-1 flex-shrink-0 rounded"
        style={{
          backgroundColor: "var(--pw-alert-error)",
          color: "#ffffff",
          fontSize: "var(--pw-text-sm)",
          fontWeight: 600,
        }}
      >
        {displayAnnouncement.type}
      </div>

      {/* 中央: お知らせテキストと残り件数 */}
      <div className="flex-1 flex items-center gap-3">
        <div
          style={{
            fontSize: "var(--pw-text-sm)",
            color: "var(--pw-alert-error)",
            fontWeight: 600,
          }}
        >
          【{formatDate(displayAnnouncement.startDate)}】{displayAnnouncement.content}
        </div>
        
        {/* 件数表示（もともと2件以上あった場合のみ表示） */}
        {/* もともと1件しかない場合は表示しない */}
        {totalCount >= 2 && (
          <div
            className="px-2 py-0.5 rounded text-xs"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              color: "var(--pw-text-primary)",
              fontWeight: 500,
            }}
          >
            {totalCount}件中{currentIndex}件目
          </div>
        )}
      </div>

      {/* 右側: 閉じるボタン */}
      <button
        onClick={() => handleClose(displayAnnouncement.id)}
        disabled={isAnimating}
        className="flex-shrink-0 p-1 transition-opacity hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          color: "var(--pw-text-primary)",
        }}
        aria-label="お知らせを閉じる"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}

