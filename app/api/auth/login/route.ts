import crypto from "crypto"
import { cookies } from "next/headers"
import { authenticateAccount } from "@/features/auth/repositories/auth.repository"
import { signToken, signTempToken } from "@/lib/jwt"
import { connectToDatabase } from "@/lib/mongodb"
import { MaintenanceSettingModel, UserModel, OtpModel } from "@/lib/models"
import { sendOtpEmail } from "@/lib/email"

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

    await connectToDatabase()
    const setting = await MaintenanceSettingModel.findOne()
    if (setting?.maintenanceMode) {
      const userCheck = await UserModel.findOne({ email: body.email.toLowerCase().trim() })
      if (!userCheck || userCheck.role !== "admin") {
        return Response.json(
          { error: "System is currently under maintenance. Please try again later." },
          { status: 503 }
        )
      }
    }

    const account = await authenticateAccount(body.email, body.password)
    if (!account) {
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )
    }

    const user = await UserModel.findOne({ email: account.email })
    if (user?.twoFactorEnabled) {
      await OtpModel.updateMany(
        { email: account.email, used: false },
        { $set: { used: true } }
      )

      const code = crypto.randomInt(100_000, 999_999).toString()
      const otp = new OtpModel({
        email: account.email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      })
      await otp.save()

      const tempToken = await signTempToken({ email: account.email, purpose: "2fa" })

      await sendOtpEmail(account.email, account.name, code).catch(() => {})

      return Response.json({
        twoFactorRequired: true,
        email: account.email,
        tempToken,
      })
    }

    const token = await signToken({
      email: account.email,
      role: account.role,
      roles: account.roles,
      name: account.name,
      id: account.id,
    })

    const cookieStore = await cookies()
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

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
