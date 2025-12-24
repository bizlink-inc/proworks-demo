import type { Talent } from "@/lib/kintone/types"

// マイページのタブ
type MyPageTab = "work-history" | "preferences"

// 必須項目の定義（名前・メールアドレスを除く）
// 優先度順に並べる（上から順に遷移先を決定）
const REQUIRED_FIELDS = [
  {
    key: "skills" as keyof Talent,
    label: "言語・ツールの経験",
    tab: "work-history" as MyPageTab,
  },
  {
    key: "experience" as keyof Talent,
    label: "主な実績・PR・職務経歴・資格",
    tab: "work-history" as MyPageTab,
  },
  {
    key: "availableFrom" as keyof Talent,
    label: "稼働可能時期",
    tab: "preferences" as MyPageTab,
  },
  {
    key: "desiredWorkDays" as keyof Talent,
    label: "希望勤務日数",
    tab: "preferences" as MyPageTab,
  },
  {
    key: "desiredWorkHours" as keyof Talent,
    label: "希望作業時間（1日あたり）",
    tab: "preferences" as MyPageTab,
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

// 未入力項目の遷移先タブを取得（優先度の高い順に最初のタブを返す）
export const getProfileIncompleteTab = (talent: Talent | null): MyPageTab | null => {
  if (!talent) {
    return REQUIRED_FIELDS[0].tab
  }

  for (const field of REQUIRED_FIELDS) {
    const value = talent[field.key]

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return field.tab
    }
  }

  return null
}

