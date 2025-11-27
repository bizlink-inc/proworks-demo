"use server"

import { auth, isVercel } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export const handleSignIn = async (email: string, password: string) => {
  // Vercel 環境では別の認証フローを使用
  if (isVercel) {
    return {
      success: false,
      error: "この環境ではサインインAPIを使用してください。"
    }
  }

  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      headers: await headers(),
    })

    redirect("/")
  } catch (error) {
    return {
      success: false,
      error: "メールアドレスまたはパスワードが正しくありません。"
    }
  }
}

export const handleSignUp = async (email: string, password: string, name: string) => {
  // Vercel 環境では別の認証フローを使用
  if (isVercel) {
    return {
      success: false,
      error: "この環境ではサインアップAPIを使用してください。"
    }
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
      headers: await headers(),
    })

    redirect("/")
  } catch (error) {
    return {
      success: false,
      error: "ユーザー登録に失敗しました。"
    }
  }
}

export const handleSignOut = async () => {
  // Vercel 環境では別の認証フローを使用
  if (isVercel) {
    redirect("/auth/signin")
  }

  await auth.api.signOut({
    headers: await headers(),
  })

  redirect("/auth/signin")
}
