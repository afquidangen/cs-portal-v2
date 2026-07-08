import { cookies } from "next/headers"
import { signToken, verifyTempToken } from "@/lib/jwt"
import { connectToDatabase } from "@/lib/mongodb"
import { MaintenanceSettingModel, UserModel, OtpModel } from "@/lib/models"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string
      code?: string
      tempToken?: string
    }

    if (!body.email || !body.code || !body.tempToken) {
      return Response.json(
        { error: "Email, code, and verification token are required." },
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

    const otp = await OtpModel.findOne({
      email: body.email,
      code: body.code,
      used: false,
      expiresAt: { $gt: new Date() },
    })

    if (!otp) {
      return Response.json(
        { error: "Invalid or expired verification code." },
        { status: 401 }
      )
    }

    otp.used = true
    await otp.save()

    const user = await UserModel.findOne({ email: body.email })
    if (!user) {
      return Response.json(
        { error: "Account not found." },
        { status: 404 }
      )
    }

    if (user.status !== "Active") {
      return Response.json(
        { error: "Account is inactive." },
        { status: 403 }
      )
    }

    const setting = await MaintenanceSettingModel.findOne()
    if (setting?.maintenanceMode && user.role !== "admin") {
      return Response.json(
        { error: "System is under maintenance. Please try again later." },
        { status: 503 }
      )
    }

    const token = await signToken({
      email: user.email,
      role: user.role,
      roles: [...(user.roles ?? [])],
      name: user.name,
      id: user.id,
    })

    const account = {
      email: user.email,
      role: user.role,
      roles: [...(user.roles ?? [])],
      name: user.name,
      id: user.id,
      route: `/${user.role}`,
      title:
        user.role === "student"
          ? `BSCS ${user.year ?? ""}${user.section ?? ""} - ${user.studentType ?? "Regular"} Student`
          : user.role === "faculty"
            ? `${user.position ?? "Faculty Member"} - Computer Science`
            : user.position ?? "System Administrator - CS Department",
    }

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
          error instanceof Error ? error.message : "Unable to verify code.",
      },
      { status: 500 }
    )
  }
}
