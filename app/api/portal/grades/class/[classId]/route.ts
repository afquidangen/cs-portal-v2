import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { assessmentRepository } from "@/features/portal/repositories/assessment.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params
    const grades = await gradesRepository.findAll({ classId })
    const columns = await gradeColumnRepository.findByClass(classId)
    const assessments = await assessmentRepository.findByClass(classId)
    return success({ grades, columns, assessments })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch class grades.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const { classId } = await params
    const body = await request.json()
    if (!body.grades || !Array.isArray(body.grades)) {
      return badRequest("grades array is required.")
    }
    const results = []
    for (const grade of body.grades) {
      const updated = await gradesRepository.upsert(
        { classId, studentId: grade.studentId },
        { ...grade, classId }
      )
      results.push(updated)
    }
    return success({ grades: results })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update grades.")
  }
}
