import { usersRepository } from "@/features/portal/repositories/users.repository"
import { rosterRepository } from "@/features/portal/repositories/roster.repository"
import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { facultyRepository } from "@/features/portal/repositories/faculty.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

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
      facultyRepository.delete({ id }).catch(() => {}),
    ])
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to permanently delete user.")
  }
}
