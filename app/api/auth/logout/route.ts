import { cookies } from "next/headers"

export const runtime = "nodejs"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return Response.json({ success: true })
}
