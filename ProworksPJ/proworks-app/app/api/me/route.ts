import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { users } from "@/lib/mockdb"

export async function GET() {
  const session = await getSession()

  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = users.find((u) => u.id === session.id)

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { password, ...userWithoutPassword } = user

  return NextResponse.json(userWithoutPassword)
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()

  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = users.find((u) => u.id === session.id)

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const body = await request.json()

  // 更新
  Object.assign(user, {
    lastName: body.lastName || user.lastName,
    firstName: body.firstName || user.firstName,
    lastNameKana: body.lastNameKana || user.lastNameKana,
    firstNameKana: body.firstNameKana || user.firstNameKana,
    birthdate: body.birthdate || user.birthdate,
    phone: body.phone,
    address: body.address,
  })

  const { password, ...userWithoutPassword } = user

  return NextResponse.json(userWithoutPassword)
}
