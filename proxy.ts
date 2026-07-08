import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { connectToDatabase } from "@/lib/mongodb"
import { MaintenanceSettingModel } from "@/lib/models/maintenance-setting.model"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-not-for-production"
)

const protectedPaths = ["/admin", "/faculty", "/student"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
  if (!isProtected) return NextResponse.next()

  const token = request.cookies.get("session")?.value
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    const role = payload.role as string | undefined

    await connectToDatabase()
    const setting = await MaintenanceSettingModel.findOne()
    const maintenanceMode = setting?.maintenanceMode ?? false

    if (maintenanceMode && role !== "admin") {
      return NextResponse.redirect(new URL("/maintenance.html", request.url))
    }

    return NextResponse.next()
<<<<<<< HEAD
  } catch (err) {
    console.error("PROXY ERROR:", err)
=======
  } catch (err){
    console.error("PROXY ERROR:", err);
>>>>>>> a125655f274c10862513d6025800c58857f25ded
    return NextResponse.redirect(new URL("/", request.url))
  }
}

export const config = {
  matcher: ["/admin/:path*", "/faculty/:path*", "/student/:path*"],
}