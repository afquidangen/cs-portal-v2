import crypto from "crypto"
import { verifyTempToken } from "@/lib/jwt"
import { connectToDatabase } from "@/lib/mongodb"
import { UserModel, OtpModel } from "@/lib/models"
import { sendOtpEmail } from "@/lib/email"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      tempToken?: string
    }

    if (!body.email || !body.tempToken) {
      return Response.json(
        { error: "Email and verification token are required." },
        { status: 400 }
      )
    }

    const payload = await verifyTempToken(body.tempToken)
    if (!payload || payload.email !== body.email) {
      return Response.json(
        { error: "Invalid or expired verification session. Please sign in again." },
        { status: 401 }
      )
    }

    await connectToDatabase()

    await OtpModel.updateMany(
      { email: body.email, used: false },
      { $set: { used: true } }
    )

    const code = crypto.randomInt(100_000, 999_999).toString()
    const otp = new OtpModel({
      email: body.email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    })
    await otp.save()

    const user = await UserModel.findOne({ email: body.email })
    await sendOtpEmail(body.email, user?.name ?? "User", code).catch(() => {})

    return Response.json({ message: "Verification code sent." })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to resend code.",
      },
      { status: 500 }
    )
  }
}
