"use client"

import { useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { signOut } from "@/lib/auth-client"

/**
 * 退会済みユーザーの処理を行うカスタムフック
 * APIレスポンスが退会エラー(403 + withdrawn: true)の場合、
 * エラーメッセージを表示してログアウトする
 */
export const useWithdrawalCheck = () => {
  const { toast } = useToast()

  /**
   * APIレスポンスが退会エラーかどうかをチェックし、
   * 退会エラーの場合はログアウト処理を行う
   * @returns true: 退会エラーだった場合, false: それ以外
   */
  const handleWithdrawalError = useCallback(async (response: Response): Promise<boolean> => {
    if (response.status === 403) {
      try {
        const data = await response.clone().json()
        if (data.withdrawn === true) {
          toast({
            title: "アカウントは退会済みです",
            description: "このアカウントは既に退会処理が完了しています。再度ご利用いただく場合は、新規登録をお願いいたします。",
            variant: "destructive",
          })

          // 少し待ってからログアウト（トーストを表示する時間を確保）
          setTimeout(async () => {
            await signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = "/"
                },
              },
            })
          }, 2000)

          return true
        }
      } catch {
        // JSONパースに失敗した場合は無視
      }
    }
    return false
  }, [toast])

  return { handleWithdrawalError }
}
