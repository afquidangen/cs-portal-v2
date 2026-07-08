import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-not-for-production"
)

const protectedPaths = ["/admin", "/faculty", "/student"]

export async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl

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

    const res = await fetch(`${origin}/api/maintenance/status`)
    const data = await res.json()

    if (data.maintenanceMode && role !== "admin") {
      return NextResponse.redirect(new URL("/maintenance.html", request.url))
    }

    return NextResponse.next()
  } catch (err){
    console.error("PROXY ERROR:", err);
    return NextResponse.redirect(new URL("/", request.url))
  }
}

export const config = {
  matcher: ["/admin/:path*", "/faculty/:path*", "/student/:path*"],
}
