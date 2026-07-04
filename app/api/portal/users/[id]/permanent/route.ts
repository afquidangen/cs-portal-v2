import { usersRepository } from "@/features/portal/repositories/users.repository"
import { rosterRepository } from "@/features/portal/repositories/roster.repository"
import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { facultyRepository } from "@/features/portal/repositories/faculty.repository"
import { schedulesRepository } from "@/features/portal/repositories/schedules.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { assessmentRepository } from "@/features/portal/repositories/assessment.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

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
          gradesRepository.deleteMany({ classId: { $in: classIds } }).catch(() => {}),
          schedulesRepository.deleteMany({ id: { $in: classIds } }).catch(() => {}),
        ])
      }
      await facultyRepository.deleteMany({ email: user.email as string }).catch(() => {})
    }

    const deleted = await usersRepository.delete({ id })
    if (!deleted) return notFound("User")
    await Promise.all([
      rosterRepository.delete({ id }).catch(() => {}),
      gradesRepository.deleteMany({ studentId: id }).catch(() => {}),
    ])
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to permanently delete user.")
  }
}
