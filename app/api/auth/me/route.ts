import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { UserModel } from "@/lib/models/user.model"
import type { Role } from "@/lib/types/common"

export const runtime = "nodejs"

function getToken(request: Request): string | null {
  const cookie = request.headers.get("cookie")
  if (!cookie) return null
  const match = cookie.match(/(?:^|;\s*)session=([^;]*)/)
  return match ? match[1] : null
}

function computeTitle(user: {
  role: Role
  year?: number | null
  section?: string | null
  studentType?: string | null
  position?: string | null
}) {
  if (user.role === "student") {
    return `BSCS ${user.year ?? ""}${user.section ?? ""} - ${user.studentType ?? "Regular"} Student`
  }
  if (user.role === "faculty") {
    return `${user.position ?? "Faculty Member"} - Computer Science`
  }
  return user.position ?? "System Administrator - CS Department"
}

export async function GET(request: Request) {
  try {
    const token = getToken(request)
    if (!token) {
      return Response.json({ error: "Not authenticated" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return Response.json({ error: "Invalid or expired session" }, { status: 401 })
    }

    await connectToDatabase()
    const user = await UserModel.findOne({ email: payload.email }).lean()
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 401 })
    }

    return Response.json({
      account: {
        email: user.email,
        role: user.role,
        name: user.name,
        id: user.id,
        title: computeTitle(user),
      },
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to verify session" },
      { status: 500 }
    )
  }
}
