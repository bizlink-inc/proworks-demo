/**
 * 開発用サインアップ自動化スクリプト
 *
 * ブラウザを開いてサインアップフォームを自動入力・送信します
 *
 * 使用方法:
 *   npm run dev:signup
 *   npm run dev:signup custom@example.com
 */

import { chromium } from "@playwright/test"

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

// ランダムな4桁英数字を生成
const generateRandomId = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ランダムな電話番号を生成（090-XXXX-XXXX形式）
const generateRandomPhone = (): string => {
  const prefixes = ["090", "080", "070"]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const middle = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
  const last = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
  return `${prefix}${middle}${last}`
}

// ランダムな生年月日を生成（18歳〜50歳）
const generateRandomBirthDate = (): { year: string; month: string; day: string } => {
  const currentYear = new Date().getFullYear()
  const minAge = 18
  const maxAge = 50
  const year = currentYear - minAge - Math.floor(Math.random() * (maxAge - minAge))
  const month = Math.floor(Math.random() * 12) + 1
  const maxDay = new Date(year, month, 0).getDate()
  const day = Math.floor(Math.random() * maxDay) + 1
  return {
    year: String(year),
    month: String(month),
    day: String(day),
  }
}

const devSignup = async (customEmail?: string) => {
  const randomId = generateRandomId()
  const timestamp = Date.now().toString(36).slice(-4) // タイムスタンプの下4桁（36進数）
  const uniqueId = `${randomId}${timestamp}`
  const birthDate = generateRandomBirthDate()

  const testData = {
    lastName: "テスト",
    firstName: `ユーザー${uniqueId}`,
    email: customEmail || `dev${uniqueId}@example.com`,
    password: "test1234",
    phone: generateRandomPhone(),
    birthYear: birthDate.year,
    birthMonth: birthDate.month,
    birthDay: birthDate.day,
  }

  console.log("\n🚀 開発用サインアップを開始します\n")
  console.log("📧 テストデータ:")
  console.log(`   メール: ${testData.email}`)
  console.log(`   パスワード: ${testData.password}`)
  console.log(`   氏名: ${testData.lastName} ${testData.firstName}`)
  console.log(`   電話: ${testData.phone}`)
  console.log(`   生年月日: ${testData.birthYear}/${testData.birthMonth}/${testData.birthDay}\n`)

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log("⏳ サインアップページを開いています...")
    await page.goto(`${BASE_URL}/auth/signup`)
    await page.waitForLoadState("networkidle")

    console.log("⏳ フォームを入力しています...")

    // 姓名
    await page.fill('input[placeholder="山田"]', testData.lastName)
    await page.fill('input[placeholder="太郎"]', testData.firstName)

    // メールアドレス
    await page.fill('input[type="email"]', testData.email)

    // パスワード
    await page.fill('input[type="password"]', testData.password)

    // 電話番号
    await page.fill('input[type="tel"]', testData.phone)

    // 生年月日
    await page.selectOption('#birth-year', testData.birthYear)
    await page.selectOption('#birth-month', testData.birthMonth)
    await page.selectOption('#birth-day', testData.birthDay)

    // 利用規約に同意
    await page.click('#terms-agreed')

    console.log("✅ フォーム入力完了！")

    // 送信ボタンをクリック
    console.log("⏳ 送信中...")
    await page.click('button[type="submit"]')

    // 画面遷移を待機（メール送信完了画面）
    await page.waitForSelector('text=メールを送信しました', { timeout: 30000 })

    console.log("\n🎉 サインアップ完了！\n")
    console.log("📝 ログイン情報:")
    console.log(`   メールアドレス: ${testData.email}`)
    console.log(`   パスワード: ${testData.password}`)
    console.log(`   氏名: ${testData.lastName} ${testData.firstName}\n`)
    console.log("🗑️  削除コマンド:")
    console.log(`   npm run delete-user ${testData.email}\n`)

    // 少し待ってからブラウザを閉じる
    await page.waitForTimeout(2000)

  } catch (error) {
    console.error("\n❌ エラー:", error)
  } finally {
    await browser.close()
  }
}

// コマンドライン引数からメールアドレスを取得
const email = process.argv[2]
devSignup(email)
