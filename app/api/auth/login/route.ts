import { authenticateAccount } from "@/features/auth/repositories/auth.repository"

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

    return Response.json({ account })
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
