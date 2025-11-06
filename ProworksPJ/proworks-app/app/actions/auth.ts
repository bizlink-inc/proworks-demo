"use server"

import { authenticate, deleteSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function handleSignIn(email: string, password: string) {
  const user = await authenticate(email, password)

  if (!user) {
    return { success: false, error: "メールアドレスまたはパスワードが正しくありません。" }
  }

  redirect("/")
}

export async function handleSignOut() {
  await deleteSession()
  redirect("/auth/signin")
}
