/**
 * 会員登録完了メール送信API
 * プロフィール完成時に呼び出される
 */

import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { sendRegistrationCompleteEmail } from "@/lib/email"
import { getTalentByAuthUserId } from "@/lib/kintone/services/talent"

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // ユーザー情報を取得
    const talent = await getTalentByAuthUserId(session.user.id)

    if (!talent) {
      return NextResponse.json({ error: "ユーザー情報が見つかりません" }, { status: 404 })
    }

    // ユーザー名を取得（優先順位: 姓名 > fullName > sessionのname）
    let userName: string
    if (talent.lastName && talent.firstName) {
      userName = `${talent.lastName} ${talent.firstName}`
    } else if (talent.fullName && talent.fullName.trim()) {
      userName = talent.fullName
    } else if (session.user.name && session.user.name.trim()) {
      userName = session.user.name
    } else {
      // 姓名が取得できない場合はエラーログを出力
      console.warn("会員登録完了メール: ユーザー名が取得できません", {
        talentLastName: talent.lastName,
        talentFirstName: talent.firstName,
        talentFullName: talent.fullName,
        sessionName: session.user.name,
      })
      userName = "会員"
    }

    // ベースURLを取得
    const headersList = await headers()
    const host = headersList.get("host") || "localhost:3000"
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`

    // 会員登録完了メールを送信
    const result = await sendRegistrationCompleteEmail(
      session.user.email!,
      userName,
      baseUrl
    )

    if (!result.success) {
      console.error("会員登録完了メール送信失敗:", result.error)
      return NextResponse.json(
        { error: "メール送信に失敗しました" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("会員登録完了メールAPI エラー:", error)
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    )
  }
}
