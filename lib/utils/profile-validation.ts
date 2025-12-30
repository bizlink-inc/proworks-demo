import type { Talent } from "@/lib/kintone/types"

// マイページのタブ
type MyPageTab = "profile" | "work-history" | "preferences"

// 必須項目の定義（名前を除く）
// 優先度順に並べる（上から順に遷移先を決定）
const REQUIRED_FIELDS = [
  // プロフィール
  {
    key: "lastNameKana" as keyof Talent,
    label: "姓（フリガナ）",
    tab: "profile" as MyPageTab,
  },
  {
    key: "firstNameKana" as keyof Talent,
    label: "名（フリガナ）",
    tab: "profile" as MyPageTab,
  },
  {
    key: "birthDate" as keyof Talent,
    label: "生年月日",
    tab: "profile" as MyPageTab,
  },
  {
    key: "phone" as keyof Talent,
    label: "電話番号",
    tab: "profile" as MyPageTab,
  },
  {
    key: "postalCode" as keyof Talent,
    label: "郵便番号",
    tab: "profile" as MyPageTab,
  },
  {
    key: "address" as keyof Talent,
    label: "住所",
    tab: "profile" as MyPageTab,
  },
  // 職歴・資格
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
    key: "resumeFiles" as keyof Talent,
    label: "経歴書",
    tab: "work-history" as MyPageTab,
  },
  // 希望条件
  {
    key: "availableFrom" as keyof Talent,
    label: "稼働可能時期",
    tab: "preferences" as MyPageTab,
  },
  {
    key: "desiredRate" as keyof Talent,
    label: "希望単価",
    tab: "preferences" as MyPageTab,
  },
  {
    key: "desiredWorkDays" as keyof Talent,
    label: "希望勤務日数",
    tab: "preferences" as MyPageTab,
  },
  {
    key: "desiredCommute" as keyof Talent,
    label: "出社頻度",
    tab: "preferences" as MyPageTab,
  },
  {
    key: "desiredWorkStyle" as keyof Talent,
    label: "希望勤務スタイル",
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

// 未入力項目のラベル配列から遷移先タブを取得（優先度の高い順に最初のタブを返す）
export const getTabFromMissingFields = (missingFields: string[]): MyPageTab => {
  if (missingFields.length === 0) {
    return "profile"
  }

  // REQUIRED_FIELDSの優先度順にラベルをチェック
  for (const field of REQUIRED_FIELDS) {
    if (missingFields.includes(field.label)) {
      return field.tab
    }
  }

  // 見つからない場合はデフォルトでprofileを返す
  return "profile"
}

