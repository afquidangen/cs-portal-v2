import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { transmutationTableRepository } from "@/features/portal/repositories/transmutation-table.repository"
import { assessmentRepository } from "@/features/portal/repositories/assessment.repository"
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
    const { classId, gradingPeriod } = body
    if (!classId) return badRequest("classId is required.")
    if (!gradingPeriod || !["midterm", "final"].includes(gradingPeriod)) {
      return badRequest("gradingPeriod must be 'midterm' or 'final'.")
    }

    const grades = await gradesRepository.findAll({ classId })
    const columns = await gradeColumnRepository.findByClass(classId)
    const assessments = await assessmentRepository.findByClass(classId)

    if (grades.length === 0) {
      return badRequest("No grades found for this class.")
    }

    const subjectTypes = new Set(grades.map((g) => (g as Record<string, unknown>).subjectType as string))
    const subjectType = subjectTypes.size === 1
      ? (subjectTypes.values().next().value as string) || "Lecture"
      : "Lecture"

    const scheme = await gradingSchemeRepository.findActiveBySubjectType(
      subjectType as "Lecture" | "Lecture with Lab"
    )

    if (!scheme) {
      return badRequest(`No active grading scheme found for ${subjectType} subjects.`)
    }

    const tt = await transmutationTableRepository.findActiveBySubjectType(
      subjectType as "Lecture" | "Lecture with Lab" | "All"
    )
    const transmutationEntries = (tt as { entries?: Array<{ min: number; max: number; equivalent: number }> } | null)
      ?.entries ?? []
    const transmutationTable: Record<string, number> = {}
    for (const entry of transmutationEntries) {
      const key = entry.min === entry.max
        ? `${entry.min}`
        : `${entry.min}-${entry.max}`
      transmutationTable[key] = entry.equivalent
    }

    const schemeData = (scheme as Record<string, unknown>)
    const components = (schemeData.components || []) as Array<Record<string, unknown>>
    const labComponents = (schemeData.labComponents || []) as Array<Record<string, unknown>>
    const lectureWeight = (schemeData.lectureWeight as number) ?? 40
    const laboratoryWeight = (schemeData.laboratoryWeight as number) ?? 60

    const columnsData = columns as Array<{ category: string; name: string; maxScore: number }>
    const assessmentData = assessments as Array<{ id: string; classId: string; name: string; category: string; maxScore: number; scores: Array<{ studentId: string; score: number }> }>

    const validationErrors: string[] = []
    const compTotal = (components as Array<Record<string, unknown>>).reduce((s, c) => s + (c.weight as number), 0)
    if (Math.abs(compTotal - 100) > 0.01) validationErrors.push(`Component weights sum to ${compTotal}%, must be 100%.`)
    for (const comp of components) {
      const cats = (comp.categories as Array<Record<string, unknown>>) ?? []
      if (cats.length === 0) continue
      const catTotal = cats.reduce((s, c) => s + (c.weight as number), 0)
      if (Math.abs(catTotal - 100) > 0.01) validationErrors.push(`"${comp.name}" categories sum to ${catTotal}%, must be 100%.`)
    }

    for (const col of columnsData) {
      const studentScore = grades.some((g) => {
        const scores = (g as Record<string, unknown>).scores as Record<string, number> | undefined
        return (scores?.[col.name] ?? 0) > (col.maxScore ?? 0)
      })
      if (studentScore) validationErrors.push(`Column "${col.name}" has student scores exceeding max score of ${col.maxScore}.`)
    }

    for (const asm of assessmentData) {
      const studentScore = asm.scores.some((s) => s.score > asm.maxScore)
      if (studentScore) validationErrors.push(`Assessment "${asm.name}" has student score exceeding max score of ${asm.maxScore}.`)
    }

    const categoriesWithAssessments = new Set<string>()
    for (const col of nonExamColumns) categoriesWithAssessments.add(col.category)
    for (const asm of assessmentData) categoriesWithAssessments.add(asm.category)
    for (const comp of components) {
      const cats = (comp.categories as Array<Record<string, unknown>>) ?? []
      for (const cat of cats) {
        if (!categoriesWithAssessments.has(cat.name as string)) {
          validationErrors.push(`Category "${cat.name}" has no assessments.`)
        }
      }
    }

    if (validationErrors.length > 0) {
      return badRequest(validationErrors.join(" | "))
    }

    const examColumns = columnsData.filter((c) => c.category.toLowerCase() === "exam")
    const nonExamColumns = columnsData.filter((c) => c.category.toLowerCase() !== "exam")

    const updatedGrades = []

    for (const grade of grades) {
      const g = grade as Record<string, unknown>
      const studentId = g.studentId as string
      const scores = (g.scores as Record<string, number>) || {}

      const assessmentsByCategory: Record<string, { studentScores: number[]; maxScores: number[] }> = {}
      for (const col of nonExamColumns) {
        if (!assessmentsByCategory[col.category]) {
          assessmentsByCategory[col.category] = { studentScores: [], maxScores: [] }
        }
        assessmentsByCategory[col.category].studentScores.push(scores[col.name] ?? 0)
        assessmentsByCategory[col.category].maxScores.push(col.maxScore)
      }

      for (const asm of assessmentData) {
        if (asm.category.toLowerCase() === "exam") continue
        if (!assessmentsByCategory[asm.category]) {
          assessmentsByCategory[asm.category] = { studentScores: [], maxScores: [] }
        }
        const studentScore = asm.scores.find((s) => s.studentId === studentId)?.score ?? 0
        assessmentsByCategory[asm.category].studentScores.push(studentScore)
        assessmentsByCategory[asm.category].maxScores.push(asm.maxScore)
      }

      const categoryGrades = computeAllCategoryGrades(assessmentsByCategory)

      const mainComponent = (components as Array<Record<string, unknown>>).find(
        (c) => ((c.name as string) || "").toLowerCase().includes("class standing") || (c.name as string) === "Class Standing"
      ) || components[0]

      const classStanding = computeClassStanding(
        categoryGrades,
        (mainComponent as Record<string, unknown>)?.categories as Array<{ name: string; weight: number }> || []
      )

      const examAssessments = assessmentData.filter((a) => a.category.toLowerCase() === "exam")
      const examScores = examColumns.map((col) => {
        const score = scores[col.name] ?? 0
        const max = col.maxScore
        return max > 0 ? (score / max) * 100 : 0
      })
      for (const asm of examAssessments) {
        const studentScore = asm.scores.find((s) => s.studentId === studentId)?.score ?? 0
        examScores.push(asm.maxScore > 0 ? (studentScore / asm.maxScore) * 100 : 0)
      }
      const examScore = examScores.length > 0
        ? examScores.reduce((sum, s) => sum + s, 0) / examScores.length
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

      const isMidterm = gradingPeriod === "midterm"
      const midtermGrade = isMidterm ? periodGrade : (g.midtermGrade as number | undefined)
      const tentativeFinalGrade = isMidterm ? (g.tentativeFinalGrade as number | undefined) : periodGrade

      const finalGrade = midtermGrade !== undefined && tentativeFinalGrade !== undefined
        ? computeFinalGrade(midtermGrade, tentativeFinalGrade) : undefined
      const transmutedGrade = finalGrade !== undefined
        ? transmuteGrade(finalGrade, Object.keys(transmutationTable).length > 0 ? transmutationTable : undefined)
        : undefined
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
        midtermGrade,
        tentativeFinalGrade,
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
