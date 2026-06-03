import { SignJWT, jwtVerify } from "jose"
import type { Role } from "@/lib/types/common"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-not-for-production"
)

export type JwtPayload = {
  email: string
  role: Role
  name: string
  id: string
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}
