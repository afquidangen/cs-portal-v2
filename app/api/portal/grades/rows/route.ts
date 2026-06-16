import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function DELETE(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { classId, studentIds } = body
    if (!classId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return badRequest("classId and studentIds array are required.")
    }

    const deleted = await gradesRepository.deleteMany({ classId, studentId: { $in: studentIds } })
    return success({ deleted })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete rows.")
  }
}
