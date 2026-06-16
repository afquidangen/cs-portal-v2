import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function PUT(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { classId, columns } = body
    if (!classId || !Array.isArray(columns)) {
      return badRequest("classId and columns array are required.")
    }

    const results = []
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]
      const updated = await gradeColumnRepository.update(
        { id: col.id },
        { order: i + 1, width: col.width }
      )
      results.push(updated)
    }
    return success({ columns: results })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to save layout.")
  }
}
