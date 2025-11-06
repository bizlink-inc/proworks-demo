import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { users } from "./mockdb"

const SECRET_KEY = new TextEncoder().encode("proworks-mock-app-secret-key-for-development-only")
const SESSION_COOKIE = "proworks-session"

export type SessionUser = {
  id: string
  email: string
  name: string
}

export async function createSession(userId: string) {
  const user = users.find((u) => u.id === userId)
  if (!user) return null

  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: `${user.lastName} ${user.firstName}`,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET_KEY)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  return {
    id: user.id,
    email: user.email,
    name: `${user.lastName} ${user.firstName}`,
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload as SessionUser
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function authenticate(email: string, password: string) {
  const user = users.find((u) => u.email === email && u.password === password)
  if (!user) return null

  return await createSession(user.id)
}
