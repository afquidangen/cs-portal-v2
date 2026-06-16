import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import {
  computeAllCategoryGrades, computeClassStanding, computeLectureGrade,
  computeLaboratoryGrade, computePeriodGrade, computeFinalGrade,
  transmuteGrade, getGradeRemarks,
} from "@/features/portal/lib/grade-engine"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { classId } = body
    if (!classId) return badRequest("classId is required.")

    const grades = await gradesRepository.findAll({ classId })
    const columns = await gradeColumnRepository.findByClass(classId)

    if (grades.length === 0) {
      return badRequest("No grades found for this class.")
    }

    const firstGrade = grades[0] as Record<string, unknown>
    const subjectType = (firstGrade.subjectType as string) || "Lecture"

    const scheme = await gradingSchemeRepository.findActiveBySubjectType(
      subjectType as "Lecture" | "Lecture with Lab"
    )

    if (!scheme) {
      return badRequest(`No active grading scheme found for ${subjectType} subjects.`)
    }

    const schemeData = (scheme as Record<string, unknown>)
    const components = (schemeData.components || []) as Array<Record<string, unknown>>
    const labComponents = (schemeData.labComponents || []) as Array<Record<string, unknown>>
    const lectureWeight = (schemeData.lectureWeight as number) ?? 40
    const laboratoryWeight = (schemeData.laboratoryWeight as number) ?? 60

    const columnsData = columns as Array<{ category: string; name: string; maxScore: number }>
    const examColumns = columnsData.filter((c) => c.category.toLowerCase() === "exam")
    const nonExamColumns = columnsData.filter((c) => c.category.toLowerCase() !== "exam")

    const updatedGrades = []

    for (const grade of grades) {
      const g = grade as Record<string, unknown>
      const scores = (g.scores as Record<string, number>) || {}

      const assessmentsByCategory: Record<string, { studentScores: number[]; maxScores: number[] }> = {}
      for (const col of nonExamColumns) {
        if (!assessmentsByCategory[col.category]) {
          assessmentsByCategory[col.category] = { studentScores: [], maxScores: [] }
        }
        assessmentsByCategory[col.category].studentScores.push(scores[col.name] ?? 0)
        assessmentsByCategory[col.category].maxScores.push(col.maxScore)
      }

      const categoryGrades = computeAllCategoryGrades(assessmentsByCategory)

      const mainComponent = (components as Array<Record<string, unknown>>).find(
        (c) => ((c.name as string) || "").toLowerCase().includes("class standing") || (c.name as string) === "Class Standing"
      ) || components[0]

      const classStanding = computeClassStanding(
        categoryGrades,
        (mainComponent as Record<string, unknown>)?.categories as Array<{ name: string; weight: number }> || []
      )

      const examScore = examColumns.length > 0
        ? examColumns.reduce<number>((sum, col) => {
            const score = scores[col.name] ?? 0
            const max = col.maxScore
            return sum + (max > 0 ? (score / max) * 100 : 0)
          }, 0) / examColumns.length
        : 0

      const lectureGrade = computeLectureGrade(classStanding, examScore)

      let laboratoryGrade: number | undefined
      if (subjectType === "Lecture with Lab" && labComponents.length > 0) {
        const labComponentsTyped = labComponents as Array<{ name: string; categories?: Array<{ name: string }> }>
        const labGrades = categoryGrades.filter((cg) =>
          labComponentsTyped.some((lc) => lc.categories?.some((cat) => cat.name === cg.category))
        )
        const labMain = labComponentsTyped.find(
          (c) => c.name.toLowerCase().includes("laboratory") || c.name === "Laboratory"
        ) || labComponentsTyped[0]
        laboratoryGrade = computeLaboratoryGrade(labGrades, (labMain?.categories || []) as Array<{ name: string; weight: number }>)
      }

      const periodGrade = computePeriodGrade(lectureGrade, laboratoryGrade, lectureWeight, laboratoryWeight)

      const midtermGrade = g.midtermGrade as number | undefined
      const tentativeFinalGrade = g.tentativeFinalGrade as number | undefined
      const finalGrade = midtermGrade !== undefined && tentativeFinalGrade !== undefined
        ? computeFinalGrade(midtermGrade, tentativeFinalGrade) : undefined
      const transmutedGrade = finalGrade !== undefined ? transmuteGrade(finalGrade) : undefined
      const remarks = transmutedGrade !== undefined ? getGradeRemarks(transmutedGrade) : "Draft"

      const updates: Record<string, unknown> = {
        categoryGrades: categoryGrades.map((cg) => ({
          category: cg.category, totalStudentScore: cg.totalStudentScore,
          totalPossibleScore: cg.totalPossibleScore, grade: cg.grade,
        })),
        lectureClassStanding: classStanding,
        lectureExam: examScore,
        lectureGrade,
        ...(laboratoryGrade !== undefined ? { laboratoryGrade } : {}),
        [midtermGrade === undefined ? "midtermGrade" : "tentativeFinalGrade"]: periodGrade,
        ...(finalGrade !== undefined ? { finalGrade } : {}),
        ...(transmutedGrade !== undefined ? { transmutedGrade } : {}),
        remarks,
        gradingSchemeId: (schemeData as { id: string }).id,
        updatedAt: new Date().toISOString(),
      }

      const updated = await gradesRepository.upsert(
        { classId, studentId: g.studentId as string },
        updates
      )
      updatedGrades.push(updated)
    }

    return success({ grades: updatedGrades })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to compute grades.")
  }
}
