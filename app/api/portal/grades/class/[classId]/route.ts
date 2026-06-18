import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { assessmentRepository } from "@/features/portal/repositories/assessment.repository"
import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
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

    const midtermColumns = (columns as Array<Record<string, unknown>>).filter(
      (c) => !c.gradingPeriod || c.gradingPeriod === "midterm" || c.gradingPeriod === "both"
    )
    const finalColumns = (columns as Array<Record<string, unknown>>).filter(
      (c) => c.gradingPeriod === "final" || c.gradingPeriod === "both"
    )
    const midtermAssessments = (assessments as Array<Record<string, unknown>>).filter(
      (a) => !a.gradingPeriod || a.gradingPeriod === "midterm" || a.gradingPeriod === "both"
    )
    const finalAssessments = (assessments as Array<Record<string, unknown>>).filter(
      (a) => a.gradingPeriod === "final" || a.gradingPeriod === "both"
    )

    return success({ grades, columns, assessments, midtermColumns, finalColumns, midtermAssessments, finalAssessments })
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
