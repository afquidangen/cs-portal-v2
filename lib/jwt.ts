import { SignJWT, jwtVerify } from "jose"
import type { Role } from "@/lib/types/common"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-not-for-production"
)

export type JwtPayload = {
  email: string
  role: Role
  roles?: string[]
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

export type TempTokenPayload = {
  email: string
  purpose: "2fa"
}

export async function signTempToken(payload: TempTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret)
}

export async function verifyTempToken(token: string): Promise<TempTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    const data = payload as unknown as TempTokenPayload
    if (data.purpose !== "2fa" || !data.email) return null
    return data
  } catch {
    return null
  }
}
