import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"
import { ApplicationsClient } from "@/components/applications-client"

export default async function ApplicationsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/auth/signin")
  }

  return <ApplicationsClient user={session} />
}

