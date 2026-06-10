import { usersRepository } from "@/features/portal/repositories/users.repository"
import { rosterRepository } from "@/features/portal/repositories/roster.repository"
import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { UserModel } from "@/lib/models"
import { success, error, notFound } from "@/lib/api-response"
import { uploadProfilePhoto } from "@/lib/cloudinary"
import { validatePassword } from "@/lib/validators"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await usersRepository.findById(id)
    if (!user) return notFound("User")
    return success(user)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch user.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json() as Record<string, unknown>

    if (typeof body.photoUrl === "string" && body.photoUrl.startsWith("data:image")) {
      console.log(`[profile] Uploading photo for user ${id} to Cloudinary...`)
      body.photoUrl = await uploadProfilePhoto(body.photoUrl, id)
      console.log(`[profile] Cloudinary URL: ${body.photoUrl}`)
    }

    if (typeof body.password === "string" && body.password.length > 0) {
      const validationError = validatePassword(body.password)
      if (validationError) return error(validationError)

      const user = await UserModel.findOne({ id })
      if (!user) return notFound("User")

      if (typeof body.currentPassword === "string") {
        const isMatch = await user.comparePassword(body.currentPassword)
        if (!isMatch) return error("Current password is incorrect.")
      }

      user.password = body.password
      await user.save()
      delete body.password
      delete body.currentPassword
    }

    const updated = await usersRepository.update({ id }, { $set: body })
    if (!updated) return notFound("User")
    return success(updated)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update user.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await usersRepository.delete({ id })
    if (!deleted) return notFound("User")
    await Promise.all([
      rosterRepository.delete({ id }).catch(() => {}),
      gradesRepository.deleteMany({ studentId: id }).catch(() => {}),
    ])
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete user.")
  }
}
