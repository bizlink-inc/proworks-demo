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
