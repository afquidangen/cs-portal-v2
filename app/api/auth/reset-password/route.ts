import { UserModel, ResetTokenModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"
import { validatePassword } from "@/lib/validators"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) return badRequest("Token and password are required.")

    const validationError = validatePassword(password)
    if (validationError) return error(validationError)

    await connectToDatabase()

    const resetToken = await ResetTokenModel.findOne({ token, used: false })
    if (!resetToken) return error("Invalid or expired reset token.")

    if (new Date() > resetToken.expiresAt) return error("Reset token has expired.")

    const user = await UserModel.findOne({ email: resetToken.email })
    if (!user) return error("User not found.")

    user.password = password
    await user.save()

    resetToken.used = true
    await resetToken.save()

    return success({ reset: true })
  } catch (err) {
    console.error("[reset-password]", err)
    return error("Unable to reset password.")
  }
}
