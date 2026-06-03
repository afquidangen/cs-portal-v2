import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-not-for-production"
)

const protectedPaths = ["/admin", "/faculty", "/student"]

export async function middleware(request: NextRequest) {
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
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL("/", request.url))
  }
}

export const config = {
  matcher: ["/admin/:path*", "/faculty/:path*", "/student/:path*"],
}
