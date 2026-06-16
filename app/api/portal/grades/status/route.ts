import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { classId, status, studentIds } = body

    if (!classId || !status) {
      return badRequest("classId and status are required.")
    }

    const validStatuses = ["Draft", "Submitted", "Reviewed", "Approved", "Locked"]
    if (!validStatuses.includes(status)) {
      return badRequest(`Invalid status. Must be one of: ${validStatuses.join(", ")}`)
    }

    const filter: Record<string, unknown> = { classId }

    if (studentIds && Array.isArray(studentIds)) {
      filter.studentId = { $in: studentIds }
    }

    const updated = await gradesRepository.updateMany(filter, {
      workflowStatus: status,
      released: status === "Approved" || status === "Locked",
      updatedAt: new Date().toISOString(),
    })

    return success({ updated })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update grade status.")
  }
}
