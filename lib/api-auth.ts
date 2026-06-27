import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/jwt"
import { UserModel } from "@/lib/models/user.model"

function getToken(request: Request): string | null {
  const cookie = request.headers.get("cookie")
  if (!cookie) return null
  const match = cookie.match(/(?:^|;\s*)session=([^;]*)/)
  return match ? match[1] : null
}

export async function requireCsoAccess(request: Request) {
  const token = getToken(request)
  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return Response.json({ error: "Invalid or expired session" }, { status: 401 })
  }

  await connectToDatabase()
  const user = await UserModel.findOne({ email: payload.email })
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 401 })
  }
  if (user.status !== "Active") {
    return Response.json({ error: "Account is inactive" }, { status: 403 })
  }

  const hasAccess = user.role === "admin" || (user.roles ?? []).includes("csso_officer")
  if (!hasAccess) {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  return { user }
}

export async function requireAdmin(request: Request) {
  const token = getToken(request)
  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return Response.json({ error: "Invalid or expired session" }, { status: 401 })
  }

  await connectToDatabase()
  const user = await UserModel.findOne({ email: payload.email })
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 401 })
  }
  if (user.status !== "Active") {
    return Response.json({ error: "Account is inactive" }, { status: 403 })
  }

  if (user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 })
  }

  return { user }
}

export async function requireAuth(request: Request) {
  const token = getToken(request)
  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return Response.json({ error: "Invalid or expired session" }, { status: 401 })
  }

  await connectToDatabase()
  const user = await UserModel.findOne({ email: payload.email })
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 401 })
  }
  if (user.status !== "Active") {
    return Response.json({ error: "Account is inactive" }, { status: 403 })
  }

  return { user }
}

export async function requireFacultyOrAdmin(request: Request) {
  const token = getToken(request)
  if (!token) {
    return Response.json({ error: "Not authenticated" }, { status: 401 })
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return Response.json({ error: "Invalid or expired session" }, { status: 401 })
  }

  await connectToDatabase()
  const user = await UserModel.findOne({ email: payload.email })
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 401 })
  }
  if (user.status !== "Active") {
    return Response.json({ error: "Account is inactive" }, { status: 403 })
  }

  if (user.role !== "admin" && user.role !== "faculty") {
    return Response.json({ error: "Faculty or admin access required" }, { status: 403 })
  }

  return { user }
}
