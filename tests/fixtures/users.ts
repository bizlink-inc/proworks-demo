// テスト用ユーザーデータ

export const validUserData = {
  email: "newuser@example.com",
  password: "password123",
  lastName: "山田",
  firstName: "太郎",
  phone: "090-1234-5678",
  birthDate: "1990-01-01",
}

export const existingUser = {
  id: "existing-user-id",
  email: "existing@example.com",
  name: "既存ユーザー",
  lastName: "既存",
  firstName: "ユーザー",
}

export const withdrawnUser = {
  id: "withdrawn-user-id",
  email: "withdrawn@example.com",
  name: "退会済みユーザー",
  ST: "退会",
}

export const unverifiedUser = {
  id: "unverified-user-id",
  email: "unverified@example.com",
  emailVerified: false,
}

export const adminUser = {
  email: "admin@example.com",
  password: "admin123",
}

// プロフィール完成済みユーザー
export const completeProfileUser = {
  id: "complete-profile-user-id",
  email: "complete@example.com",
  氏名: "完成太郎",
  姓: "完成",
  名: "太郎",
  姓_フリガナ: "カンセイ",
  名_フリガナ: "タロウ",
  電話番号: "090-1234-5678",
  生年月日: "1990-01-01",
  郵便番号: "100-0001",
  住所: "東京都千代田区",
  職種: ["エンジニア"],
  言語_ツール: "React, TypeScript",
  主な実績_PR_職務経歴: "経験豊富",
  希望稼働時期: "即日",
  希望単価_月額: "800000",
  希望稼働日数: "5日/週",
  出社頻度: "フルリモート",
  希望勤務スタイル: "業務委託",
  希望時間: "140-180h",
}

// プロフィール未完成ユーザー
export const incompleteProfileUser = {
  id: "incomplete-profile-user-id",
  email: "incomplete@example.com",
  氏名: "未完成太郎",
  姓: "未完成",
  名: "太郎",
  // 必須項目が未入力
  姓_フリガナ: "",
  名_フリガナ: "",
  電話番号: "",
}
