import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { transmutationTableRepository } from "@/features/portal/repositories/transmutation-table.repository"
import { assessmentRepository } from "@/features/portal/repositories/assessment.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { UserModel, CurriculumModel } from "@/lib/models"
import type { GradingPeriod } from "@/lib/types"
import {
  computeAllCategoryGrades, computeClassStanding,
  computeLectureGrade,   computeExamGrade,
  computeLaboratoryGrade, computePeriodGrade, computeFinalGrade,
  transmuteGrade, getGradeRemarks, gradeCategoryMatches,
  findCurriculumSubjectPosition,
} from "@/features/portal/lib/grade-engine"
import type { CategoryGradeResult } from "@/features/portal/lib/grade-engine"

export const runtime = "nodejs"

function scoreKey(col: { name: string; gradingPeriod?: string }) {
  return col.gradingPeriod && col.gradingPeriod !== "both"
    ? `${col.gradingPeriod}_${col.name}`
    : col.name
}

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

    const period = gradingPeriod as GradingPeriod

    const grades = await gradesRepository.findAll({ classId })
    const allColumns = await gradeColumnRepository.findByClass(classId)
    const allAssessments = await assessmentRepository.findByClass(classId)

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

    const columnsData = allColumns as Array<{ category: string; name: string; maxScore: number; gradingPeriod?: string }>
    const assessmentData = allAssessments as Array<{ id: string; classId: string; name: string; category: string; maxScore: number; gradingPeriod?: string; scores: Array<{ studentId: string; score: number }> }>

    const periodColumns = columnsData.filter(
      (c) => !c.gradingPeriod || c.gradingPeriod === period || c.gradingPeriod === "both"
    )
    const periodAssessments = assessmentData.filter(
      (a) => !a.gradingPeriod || a.gradingPeriod === period || a.gradingPeriod === "both"
    )

    const validationErrors: string[] = []

    const compTotal = (components as Array<Record<string, unknown>>).reduce((s, c) => s + (c.weight as number), 0)
    if (Math.abs(compTotal - 100) > 0.01) validationErrors.push(`Component weights sum to ${compTotal}%, must be 100%.`)
    if (subjectType === "Lecture with Lab") {
      if (lectureWeight + laboratoryWeight !== 100) {
        validationErrors.push(`Lecture weight (${lectureWeight}%) + Laboratory weight (${laboratoryWeight}%) must equal 100%.`)
      }
    }

    for (const col of periodColumns) {
      const studentScore = grades.some((g) => {
        const scores = (g as Record<string, unknown>).scores as Record<string, number> | undefined
        return (scores?.[scoreKey(col)] ?? scores?.[col.name] ?? 0) > (col.maxScore ?? 0)
      })
      if (studentScore) validationErrors.push(`Column "${col.name}" has student scores exceeding max score of ${col.maxScore}.`)
    }

    for (const asm of periodAssessments) {
      const studentScore = asm.scores.some((s) => s.score > asm.maxScore)
      if (studentScore) validationErrors.push(`Assessment "${asm.name}" has student score exceeding max score of ${asm.maxScore}.`)
    }

    if (validationErrors.length > 0) {
      return badRequest(validationErrors.join(" | "))
    }

    const allPeriodColumns = periodColumns
    const allPeriodAssessments = periodAssessments

    const updatedGrades = []

    for (const grade of grades) {
      const g = grade as Record<string, unknown>
      const studentId = g.studentId as string
      const scores = (g.scores as Record<string, number>) || {}
      const absencesMap: Record<string, number> = {}
      for (const [key, val] of Object.entries(scores)) {
        if (key.startsWith(`${period}_absences_`)) {
          absencesMap[key.replace(`${period}_absences_`, "")] = Number(val) || 0
        }
      }

      const componentsTyped = components as Array<{ name: string; weight: number; categories: Array<{ name: string; weight: number; isAttendance?: boolean }>; isExam?: boolean }>
      const labComponentsTyped = labComponents as Array<{ name: string; categories: Array<{ name: string; weight: number; isAttendance?: boolean }>; isExam?: boolean }>

      const standingComponent = componentsTyped.find(
        (c) => c.isExam === false
      ) || componentsTyped.find(
        (c) => c.name.toLowerCase().includes("class standing") || c.name.toLowerCase().includes("lecture class standing")
      ) || componentsTyped[0]
      const examComponent = componentsTyped.find(
        (c) => c.isExam === true
      ) || componentsTyped.find(
        (c) => c.name.toLowerCase().includes("exam")
      ) || componentsTyped[1]

      const standingCategories = standingComponent?.categories || []
      const examCategories = examComponent?.categories || []
      const standingWeight = standingComponent?.weight ?? 60
      const examWeight = examComponent?.weight ?? 40

      const examColumnNames = new Set(periodColumns
        .filter((col) => examCategories.some((cat) => gradeCategoryMatches(cat.name, col.category)))
        .map((col) => col.name))

      const nonExamColumns = periodColumns.filter((col) => !examColumnNames.has(col.name))
      const examPeriodColumns = periodColumns.filter((col) => examColumnNames.has(col.name))

      const examAssessmentIds = new Set(periodAssessments
        .filter((asm) => examCategories.some((cat) => gradeCategoryMatches(cat.name, asm.category)))
        .map((asm) => asm.id))

      const nonExamAssessments = periodAssessments.filter((asm) => !examAssessmentIds.has(asm.id))
      const examPeriodAssessments = periodAssessments.filter((asm) => examAssessmentIds.has(asm.id))

      let classStanding: number
      let examGrade: number
      let laboratoryGrade: number | undefined
      let categoryGrades: CategoryGradeResult[] = []

      if (subjectType === "Lecture with Lab" && labComponentsTyped.length > 0) {
        const labComponent = labComponentsTyped.find(
          (c) => c.name.toLowerCase().includes("laboratory") || c.name === "Laboratory"
        ) || labComponentsTyped[0]

        const labCategories = labComponent?.categories || []

        const lectureAssessmentsByCategory: Record<string, { studentScores: number[]; maxScores: number[] }> = {}
        const labAssessmentsByCategory: Record<string, { studentScores: number[]; maxScores: number[] }> = {}
        const examItems: Array<{ maxScore: number; studentScore: number }> = []

        for (const col of allPeriodColumns) {
          if (examColumnNames.has(col.name)) {
            examItems.push({
              maxScore: col.maxScore,
              studentScore: scores[scoreKey(col)] ?? scores[col.name] ?? 0,
            })
            continue
          }
          const lectureCategory = standingCategories.find((cat) => gradeCategoryMatches(cat.name, col.category))?.name
          const labCategory = labCategories.find((cat) => gradeCategoryMatches(cat.name, col.category))?.name
          const target = lectureCategory ? lectureAssessmentsByCategory
            : labCategory ? labAssessmentsByCategory
            : null
          const categoryName = lectureCategory ?? labCategory
          if (target) {
            if (!target[categoryName!]) {
              target[categoryName!] = { studentScores: [], maxScores: [] }
            }
            target[categoryName!].studentScores.push(scores[scoreKey(col)] ?? scores[col.name] ?? 0)
            target[categoryName!].maxScores.push(col.maxScore)
          }
        }

        for (const asm of allPeriodAssessments) {
          if (examAssessmentIds.has(asm.id)) {
            examItems.push({
              maxScore: asm.maxScore,
              studentScore: asm.scores.find((s) => s.studentId === studentId)?.score ?? 0,
            })
            continue
          }
          const lectureCategory = standingCategories.find((cat) => gradeCategoryMatches(cat.name, asm.category))?.name
          const labCategory = labCategories.find((cat) => gradeCategoryMatches(cat.name, asm.category))?.name
          const target = lectureCategory ? lectureAssessmentsByCategory
            : labCategory ? labAssessmentsByCategory
            : null
          const categoryName = lectureCategory ?? labCategory
          if (target) {
            if (!target[categoryName!]) {
              target[categoryName!] = { studentScores: [], maxScores: [] }
            }
            const studentScore = asm.scores.find((s) => s.studentId === studentId)?.score ?? 0
            target[categoryName!].studentScores.push(studentScore)
            target[categoryName!].maxScores.push(asm.maxScore)
          }
        }

        const lectureWeights: Record<string, number> = {}
        for (const cat of standingCategories) lectureWeights[cat.name] = cat.weight
        const labWeights: Record<string, number> = {}
        for (const cat of labCategories) labWeights[cat.name] = cat.weight

        const lectureCategoryGrades = computeAllCategoryGrades(lectureAssessmentsByCategory, lectureWeights, absencesMap, standingCategories)
        const labCategoryGrades = computeAllCategoryGrades(labAssessmentsByCategory, labWeights, absencesMap, labCategories)

        categoryGrades = [...lectureCategoryGrades, ...labCategoryGrades]
        classStanding = computeClassStanding(lectureCategoryGrades, standingCategories)
        examGrade = computeExamGrade(examItems)
        laboratoryGrade = computeLaboratoryGrade(labCategoryGrades, labCategories)
      } else {
        const assessmentsByCategory: Record<string, { studentScores: number[]; maxScores: number[] }> = {}
        const examItems: Array<{ maxScore: number; studentScore: number }> = []

        for (const col of allPeriodColumns) {
          if (examColumnNames.has(col.name)) {
            examItems.push({
              maxScore: col.maxScore,
              studentScore: scores[scoreKey(col)] ?? scores[col.name] ?? 0,
            })
            continue
          }
          const categoryName = standingCategories.find((cat) => gradeCategoryMatches(cat.name, col.category))?.name
          if (!categoryName) continue
          if (!assessmentsByCategory[categoryName]) {
            assessmentsByCategory[categoryName] = { studentScores: [], maxScores: [] }
          }
          assessmentsByCategory[categoryName].studentScores.push(scores[scoreKey(col)] ?? scores[col.name] ?? 0)
          assessmentsByCategory[categoryName].maxScores.push(col.maxScore)
        }

        for (const asm of allPeriodAssessments) {
          if (examAssessmentIds.has(asm.id)) {
            examItems.push({
              maxScore: asm.maxScore,
              studentScore: asm.scores.find((s) => s.studentId === studentId)?.score ?? 0,
            })
            continue
          }
          const categoryName = standingCategories.find((cat) => gradeCategoryMatches(cat.name, asm.category))?.name
          if (!categoryName) continue
          if (!assessmentsByCategory[categoryName]) {
            assessmentsByCategory[categoryName] = { studentScores: [], maxScores: [] }
          }
          const studentScore = asm.scores.find((s) => s.studentId === studentId)?.score ?? 0
          assessmentsByCategory[categoryName].studentScores.push(studentScore)
          assessmentsByCategory[categoryName].maxScores.push(asm.maxScore)
        }

        const standingWeights: Record<string, number> = {}
        for (const cat of standingCategories) standingWeights[cat.name] = cat.weight

        categoryGrades = computeAllCategoryGrades(assessmentsByCategory, standingWeights, absencesMap, standingCategories)
        classStanding = computeClassStanding(categoryGrades, standingCategories)
        examGrade = computeExamGrade(examItems)
      }

      const lectureGrade = computeLectureGrade(classStanding, examGrade, standingWeight, examWeight)
      const periodGrade = computePeriodGrade(lectureGrade, laboratoryGrade, lectureWeight, laboratoryWeight)

      const updates: Record<string, unknown> = {
        categoryGrades: categoryGrades.map((cg) => ({
          category: cg.category,
          totalStudentScore: cg.totalStudentScore,
          totalPossibleScore: cg.totalPossibleScore,
          percentageScore: cg.percentageScore,
          weightedScore: cg.weightedScore,
          grade: cg.grade,
        })),
        gradingSchemeId: (schemeData as { id: string }).id,
        updatedAt: new Date().toISOString(),
      }

      if (period === "midterm") {
        updates.midtermClassStanding = classStanding
        updates.midtermExam = examGrade
        if (laboratoryGrade !== undefined) updates.midtermLaboratoryGrade = laboratoryGrade
        updates.midtermGrade = periodGrade
        const midtermTransmuted = transmuteGrade(periodGrade, Object.keys(transmutationTable).length > 0 ? transmutationTable : undefined)
        updates.midtermTransmuted = midtermTransmuted
        updates.midtermRemarks = getGradeRemarks(midtermTransmuted)
        updates.lectureClassStanding = classStanding
        updates.lectureExam = examGrade
        updates.lectureGrade = lectureGrade
        if (laboratoryGrade !== undefined) updates.laboratoryGrade = laboratoryGrade
      } else {
        updates.finalClassStanding = classStanding
        updates.finalExam = examGrade
        if (laboratoryGrade !== undefined) updates.finalLaboratoryGrade = laboratoryGrade
        updates.tentativeFinalGrade = periodGrade
        updates.finalTransmuted = transmuteGrade(periodGrade, Object.keys(transmutationTable).length > 0 ? transmutationTable : undefined)

        const existingMidtermGrade = g.midtermGrade as number | undefined
        if (existingMidtermGrade !== undefined && existingMidtermGrade > 0) {
          const finalGrade = computeFinalGrade(existingMidtermGrade, periodGrade)
          const transmuted = transmuteGrade(finalGrade, Object.keys(transmutationTable).length > 0 ? transmutationTable : undefined)
          updates.finalGrade = finalGrade
          updates.transmutedGrade = transmuted
        }
      }

      if (period === "final") {
        if (updates.transmutedGrade !== undefined) {
          const r = getGradeRemarks(updates.transmutedGrade as number)
          updates.remarks = r
          updates.finalRemarks = r
        } else if (updates.finalTransmuted !== undefined) {
          const r = getGradeRemarks(updates.finalTransmuted as number)
          updates.remarks = r
          updates.finalRemarks = r
        }

        if (!updates.remarks) {
          const special = ["INC", "FAILED", "DROPPED"]
          const existingRemarks = (g.remarks as string | undefined) ?? ""
          if (existingRemarks && special.includes(existingRemarks)) {
            updates.remarks = existingRemarks
            updates.finalRemarks = existingRemarks
          }
        }
      }

      const existingGrade = await gradesRepository.findOne({ classId, studentId: g.studentId as string })
      let updated: unknown
      if (existingGrade) {
        updated = await gradesRepository.update(
          { classId, studentId: g.studentId as string },
          updates
        )
      } else {
        updated = await gradesRepository.create({
          ...g,
          ...updates,
          id: `GRD-${Date.now()}-${g.studentId as string}-${Math.random().toString(36).slice(2, 10)}`,
        })
      }
      updatedGrades.push(updated)
    }

    if (period === "final") {
      const curriculaCache = new Map<string, unknown>()

      for (const result of updatedGrades) {
        const r = result as Record<string, unknown>
        const studentId = r.studentId as string
        const code = r.code as string
        const finalGrade = r.finalGrade as number | undefined
        if (finalGrade === undefined) continue
        const transmuted = r.transmutedGrade as number | undefined
        const user = await UserModel.findOne({ id: studentId })
        if (!user) continue

        const u = user as unknown as Record<string, unknown>
        const userCurriculumId = (u.curriculumId as string) ?? ""
        let curriculumTerms: unknown = null
        if (userCurriculumId) {
          if (curriculaCache.has(userCurriculumId)) {
            curriculumTerms = curriculaCache.get(userCurriculumId)
          } else {
            const curriculum = await CurriculumModel.findOne({ id: userCurriculumId }).lean()
            const terms = (curriculum as Record<string, unknown> | null)?.terms ?? null
            curriculaCache.set(userCurriculumId, terms)
            curriculumTerms = terms
          }
        }

        const position = findCurriculumSubjectPosition(
          curriculumTerms as { terms: Array<{ year: string; semester: string; subjects: Array<{ code: string }> }> } | null,
          code
        )

        const history = user.gradeHistory ? [...user.gradeHistory] : []
        const existingIdx = (history as Array<Record<string, unknown>>).findIndex(
          (h) => h.subjectCode === code
        )
        const entry: Record<string, unknown> = {
          subjectCode: code,
          subjectName: r.subject,
          finalPercentile: finalGrade,
          transmutedGrade: transmuted ?? 0,
          remarks: getGradeRemarks(transmuted ?? 5.0),
          section: r.section,
          curriculumId: userCurriculumId,
          yearLevel: position?.yearLevel ?? (u.currentYearLevel as string) ?? "",
          semester: position?.semester ?? (u.currentSemester as string) ?? "",
        }
        if (existingIdx >= 0) {
          const existing = (history as Array<Record<string, unknown>>)[existingIdx]
          const merged = {
            ...entry,
            yearLevel: existing.yearLevel || entry.yearLevel,
            semester: existing.semester || entry.semester,
            curriculumId: existing.curriculumId || entry.curriculumId,
          }
          ;(history as Array<Record<string, unknown>>)[existingIdx] = { ...existing, ...merged }
        } else {
          ;(history as Array<Record<string, unknown>>).push(entry)
        }
        await UserModel.updateOne({ id: studentId }, { $set: { gradeHistory: history } })
      }
    }

    return success({ grades: updatedGrades })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to compute grades.")
  }
}
