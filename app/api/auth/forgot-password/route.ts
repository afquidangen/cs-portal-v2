import crypto from "crypto"
import { UserModel, ResetTokenModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"
import { sendPasswordResetEmail } from "@/lib/email"
import { success, error, badRequest } from "@/lib/api-response"
import { checkRateLimit } from "@/lib/security/rate-limit"
import { RATE_LIMITS } from "@/lib/security/constants"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) return badRequest("Email is required.")

    const rl = await checkRateLimit(request, RATE_LIMITS.FORGOT_PASSWORD, email)
    if (rl) return rl

    await connectToDatabase()

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() })
    if (!user) return success({ sent: true })

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await ResetTokenModel.create({ email: user.email, token, expiresAt, used: false })

    const appUrl =
      process.env.APP_URL ??
      (process.env.NODE_ENV === "production"
        ? `https://${request.headers.get("host") ?? "localhost:3000"}`
        : `http://${request.headers.get("host") ?? "localhost:3000"}`)

    await sendPasswordResetEmail(user.email, user.name, token, appUrl)

    return success({ sent: true })
  } catch (err) {
    console.error("[forgot-password]", err)
    return error("Unable to send reset email.")
  }
}
