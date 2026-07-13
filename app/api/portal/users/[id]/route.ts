import { usersRepository } from "@/features/portal/repositories/users.repository"
import { rosterRepository } from "@/features/portal/repositories/roster.repository"
import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { facultyRepository } from "@/features/portal/repositories/faculty.repository"
import { schedulesRepository } from "@/features/portal/repositories/schedules.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { assessmentRepository } from "@/features/portal/repositories/assessment.repository"
import { UserModel, DeansListModel } from "@/lib/models"
import { success, error, notFound } from "@/lib/api-response"
import { uploadProfilePhoto, destroyFile } from "@/lib/cloudinary"
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

    if (body.removePhoto) {
      const existingUser = (await usersRepository.findById(id)) as Record<string, unknown> | null
      const oldPublicId = existingUser?.cloudinaryPublicId
      if (oldPublicId) {
        await destroyFile(oldPublicId as string, "image").catch(() => {})
      }
      delete body.removePhoto
      body.photoUrl = ""
      body.cloudinaryPublicId = ""
    }

    if (typeof body.photoUrl === "string" && body.photoUrl.startsWith("data:image")) {
      const existingUser = (await usersRepository.findById(id)) as Record<string, unknown> | null
      const oldPublicId = existingUser?.cloudinaryPublicId
      if (oldPublicId) {
        await destroyFile(oldPublicId as string, "image").catch(() => {})
      }
      const result = await uploadProfilePhoto(body.photoUrl, id)
      body.photoUrl = result.secureUrl
      body.cloudinaryPublicId = result.publicId
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

    const updated = await usersRepository.update({ id }, body)
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

    const user = await usersRepository.findById(id) as Record<string, unknown> | null
    if (user?.role === "faculty") {
      const schedules = await schedulesRepository.findAll({ instructor: user.name as string }) as Record<string, unknown>[]
      const classIds = schedules.map((s) => s.id as string)
      if (classIds.length > 0) {
        await Promise.all([
          gradeColumnRepository.deleteMany({ classId: { $in: classIds } }).catch(() => {}),
          assessmentRepository.deleteMany({ classId: { $in: classIds } }).catch(() => {}),
          gradesRepository.softDelete({ classId: { $in: classIds } }).catch(() => {}),
          schedulesRepository.deleteMany({ id: { $in: classIds } }).catch(() => {}),
        ])
      }
      await facultyRepository.deleteMany({ email: user.email as string }).catch(() => {})
    }

    const deleted = await usersRepository.softDelete({ id })
    if (!deleted) return notFound("User")
    await Promise.all([
      rosterRepository.softDelete({ id }).catch(() => {}),
      gradesRepository.softDelete({ studentId: id }).catch(() => {}),
      DeansListModel.deleteMany({ studentId: id }).catch(() => {}),
    ])
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete user.")
  }
}
