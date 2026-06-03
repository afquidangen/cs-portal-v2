export const runtime = "nodejs"

export async function POST() {
  const response = Response.json({ success: true })
  response.headers.set(
    "Set-Cookie",
    "session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0"
  )
  return response
}
