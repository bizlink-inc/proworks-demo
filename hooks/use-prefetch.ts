"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

/**
 * バックグラウンドで他ページのデータを先読みするフック
 * 初期表示完了後、ユーザーがページを閲覧している間に
 * 他のページで必要なデータをサーバーサイドでキャッシュに保存
 */
export function usePrefetch() {
  const router = useRouter()
  const prefetched = useRef(false)

  useEffect(() => {
    if (prefetched.current) return
    prefetched.current = true

    // 初期レンダリング完了後に先読みを開始
    const timer = setTimeout(async () => {
      try {
        // 1. データを先読み（キャッシュを温める）
        // 低優先度で実行し、UIをブロックしない
        fetch('/api/prefetch', {
          priority: 'low' as RequestPriority,
          cache: 'no-store' // 常に新しいデータをキャッシュ
        }).catch(() => {}) // エラーは無視

        // 2. RSCペイロードも先読み
        router.prefetch('/me')
        router.prefetch('/applications')
      } catch {
        // エラーは無視
      }
    }, 500) // 0.5秒後に開始（初期表示を優先しつつ早めに）

    return () => clearTimeout(timer)
  }, [router])
}

/**
 * 次のページデータを先読みするフック
 * @param currentPage 現在のページ番号
 * @param totalPages 総ページ数
 * @param buildUrl ページ番号からURLを生成する関数
 */
export function usePrefetchNextPage(
  currentPage: number,
  totalPages: number,
  buildUrl: (page: number) => string
) {
  const prefetchedPages = useRef<Set<number>>(new Set([1]))

  useEffect(() => {
    // 次のページが存在し、まだ先読みしていない場合
    const nextPage = currentPage + 1
    if (nextPage <= totalPages && !prefetchedPages.current.has(nextPage)) {
      const timer = setTimeout(() => {
        fetch(buildUrl(nextPage), { priority: 'low' as RequestPriority })
          .catch(() => {}) // エラーは無視
        prefetchedPages.current.add(nextPage)
      }, 500) // 現在ページ表示後500msで先読み

      return () => clearTimeout(timer)
    }
  }, [currentPage, totalPages, buildUrl])
}
