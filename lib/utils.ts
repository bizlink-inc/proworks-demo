import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 数値を万円単位でフォーマット
 * @param value - 金額（数値または文字列）
 * @returns フォーマット済み文字列（例: "70万円"）
 */
export function formatCurrency(value: string | number | null | undefined): string {
  if (!value) return '応相談'
  
  const num = typeof value === 'string' ? parseInt(value, 10) : value
  
  if (isNaN(num)) return '応相談'
  
  // 万円単位でフォーマット
  return `${num}万円`
}

/**
 * kintoneの応募ステータス値をアプリ側の表示用ラベルに変換
 * 仕様: 応募済み=応募済み, 面談調整中=面談調整中, 予定決定=面談予定, 案件参画=案件決定, 見送り=募集終了
 * @param kintoneStatus - kintoneから取得したステータス値
 * @returns アプリ側で表示するラベル
 */
export const mapApplicationStatusToDisplay = (kintoneStatus: string | null | undefined): string | null => {
  if (!kintoneStatus) return null

  switch (kintoneStatus) {
    case "応募済み":
      return "応募済み"
    case "面談調整中":
      return "面談調整中"
    case "予定決定":
    case "面談予定": // 既に変換済みの場合も対応
      return "面談予定"
    case "案件参画":
      return "案件決定"
    case "見送り":
      return "募集終了"
    default:
      // 未知の値はそのまま返す（後方互換性のため）
      return kintoneStatus
  }
}
