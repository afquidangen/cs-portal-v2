import { authenticateAccount } from "@/features/auth/repositories/auth.repository"
import { signToken } from "@/lib/jwt"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      password?: string
    }

    if (!body.email || !body.password) {
      return Response.json(
        { error: "Email and password are required." },
        { status: 400 }
      )
    }

    const account = await authenticateAccount(body.email, body.password)
    if (!account) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )
    }

    const token = await signToken({
      email: account.email,
      role: account.role,
      roles: account.roles,
      name: account.name,
      id: account.id,
    })

    const response = Response.json({ account })
    response.headers.set(
      "Set-Cookie",
      `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`
    )

    return response
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to sign in.",
      },
      { status: 500 }
    )
  }
}
