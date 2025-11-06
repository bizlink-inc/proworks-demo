"use server"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"

export const handleSignIn = async (email: string, password: string) => {
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
  await auth.api.signOut({
    headers: await headers(),
  })
  
  redirect("/auth/signin")
}
