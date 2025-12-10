import type { Talent } from "@/lib/kintone/types"

// 必須項目の定義（名前・メールアドレスを除く）
const REQUIRED_FIELDS = [
  {
    key: "skills" as keyof Talent,
    label: "言語・ツールの経験",
  },
  {
    key: "experience" as keyof Talent,
    label: "主な実績・PR・職務経歴・資格",
  },
  {
    key: "availableFrom" as keyof Talent,
    label: "稼働可能時期",
  },
  {
    key: "desiredWorkDays" as keyof Talent,
    label: "希望勤務日数",
  },
  {
    key: "desiredWorkHours" as keyof Talent,
    label: "希望作業時間（1日あたり）",
  },
] as const

// 必須項目が未入力かチェック
export const checkRequiredFields = (talent: Talent | null): string[] => {
  if (!talent) {
    return REQUIRED_FIELDS.map((field) => field.label)
  }

  const missingFields: string[] = []

  for (const field of REQUIRED_FIELDS) {
    const value = talent[field.key]
    
    // 値が空文字列、null、undefined、または空配列の場合は未入力とみなす
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      missingFields.push(field.label)
    }
  }

  return missingFields
}

