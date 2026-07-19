import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { assessmentRepository } from "@/features/portal/repositories/assessment.repository"
import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { ScheduleModel, GradeModel } from "@/lib/models"
import { recomputeDeansListForSemester } from "@/features/portal/lib/deans-list-utils"

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
    
    const gradingPeriod = body.gradingPeriod || "midterm"
    
    const existingGrades = await GradeModel.find({ classId }).lean()
    const existingMap = new Map(existingGrades.map(g => [`${g.studentId}_${g.code}`, g]))
    
    const rejectedGrades: Array<{ studentId: string; code: string; reason: string }> = []
    
    for (const grade of body.grades) {
      const key = `${grade.studentId}_${grade.code}`
      const existing = existingMap.get(key)
      
      if (existing) {
        if (gradingPeriod === "midterm" && existing.midtermReleased) {
          rejectedGrades.push({ studentId: grade.studentId, code: grade.code, reason: "Midterm grade is released" })
          continue
        }
        if (gradingPeriod === "final" && existing.finalReleased) {
          rejectedGrades.push({ studentId: grade.studentId, code: grade.code, reason: "Final grade is released" })
          continue
        }
      }
    }
    
    if (rejectedGrades.length > 0) {
      return badRequest(`${rejectedGrades.length} grade(s) are released and cannot be edited. Unrelease them first.`)
    }
    
    const schedule = await ScheduleModel.findOne({ id: classId }).lean()
    const semesterId = schedule?.semesterId

    const results = []
    for (const grade of body.grades) {
      const { __v: _v, _id, ...upsertData } = grade
      if (!upsertData.semesterId && semesterId) upsertData.semesterId = semesterId
      if (upsertData.scores) {
        const cleanedScores: Record<string, number> = {}
        for (const [key, value] of Object.entries(upsertData.scores as Record<string, unknown>)) {
          cleanedScores[key] = Number(value) || 0
        }
        upsertData.scores = cleanedScores
      }
      const finalRemarks = upsertData.finalRemarks as string | undefined
      const midtermRemarks = upsertData.midtermRemarks as string | undefined
      if (finalRemarks) {
        upsertData.remarks = finalRemarks
      } else if (midtermRemarks) {
        upsertData.remarks = midtermRemarks
      }

      let filter: Record<string, unknown>
      if (grade.id && !String(grade.id).startsWith("pending-")) {
        filter = { id: grade.id }
      } else {
        filter = { studentId: grade.studentId, code: grade.code }
        if (upsertData.semesterId) filter.semesterId = upsertData.semesterId
      }
      const updated = await gradesRepository.upsert(filter, { ...upsertData, classId })
      results.push(updated)
    }

    if (semesterId) {
      recomputeDeansListForSemester(semesterId).catch((dlErr) =>
        console.warn("[DeansList] Auto re-evaluation failed after grade edit:", dlErr)
      )
    }

    return success({ grades: results })
  } catch (err) {
    console.error("[GradeSaveError]", err)
    return error(err instanceof Error ? err.message : "Unable to update grades.")
  }
}
