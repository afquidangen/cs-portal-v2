import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    if (!body.classId || !body.name || !body.category || !body.gradingPeriod) {
      return badRequest("classId, name, category, and gradingPeriod are required.")
    }
    if (!["midterm", "final", "both"].includes(body.gradingPeriod)) {
      return badRequest("gradingPeriod must be 'midterm', 'final', or 'both'.")
    }

    const existing = await gradeColumnRepository.findAll({ classId: body.classId }) as Array<{ order: number }>
    const maxOrder = existing.reduce((max: number, col: { order: number }) => Math.max(max, col.order ?? 0), 0)

      const normalizedCategory =
        body.category === "Performance/Recitation" ? "Performance" :
        body.category === "Lec Attendance" || body.category === "Lecture Attendance" ? "Attendance" :
        body.category === "Assignment" ? "Assignments" :
        body.category

      const column = await gradeColumnRepository.create({
        id: `COL-${Date.now()}`,
        classId: body.classId,
        name: body.name,
        displayName: body.displayName || body.name,
        category: normalizedCategory,
      gradingPeriod: body.gradingPeriod,
      maxScore: body.maxScore ?? 100,
      order: maxOrder + 1,
    })

    return success(column, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create column.")
  }
}
