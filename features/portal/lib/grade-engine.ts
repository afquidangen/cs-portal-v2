export type GradingCategoryDef = {
  name: string
  weight: number
}

export type SchemeComponentDef = {
  name: string
  weight: number
  categories: GradingCategoryDef[]
}

export type GradeInput = {
  scores: Record<string, number>
  categoryGrades?: Record<string, { totalStudentScore: number; totalPossibleScore: number }>
}

export type CategoryGradeResult = {
  category: string
  totalStudentScore: number
  totalPossibleScore: number
  grade: number
}

export type ComputedGrades = {
  categoryGrades: CategoryGradeResult[]
  classStanding?: number
  lectureGrade?: number
  laboratoryGrade?: number
  periodGrade: number
  finalGrade?: number
  transmutedGrade?: number
}

export function computeCategoryGrade(
  totalStudentScore: number,
  totalPossibleScore: number
): number {
  if (totalPossibleScore === 0) return 0
  return Number(((totalStudentScore / totalPossibleScore) * 100).toFixed(2))
}

export function computeAllCategoryGrades(
  assessmentsByCategory: Record<string, { studentScores: number[]; maxScores: number[] }>
): CategoryGradeResult[] {
  return Object.entries(assessmentsByCategory).map(([category, data]) => {
    const totalStudentScore = data.studentScores.reduce((sum, s) => sum + s, 0)
    const totalPossibleScore = data.maxScores.reduce((sum, s) => sum + s, 0)
    const grade = computeCategoryGrade(totalStudentScore, totalPossibleScore)
    return { category, totalStudentScore, totalPossibleScore, grade }
  })
}

export function computeClassStanding(
  categoryGrades: CategoryGradeResult[],
  categories: GradingCategoryDef[]
): number {
  let weightedSum = 0
  for (const cat of categories) {
    const gradeRecord = categoryGrades.find((cg) => cg.category === cat.name)
    if (gradeRecord) {
      weightedSum += gradeRecord.grade * (cat.weight / 100)
    }
  }
  return Number(weightedSum.toFixed(2))
}

export function computeLectureGrade(
  classStanding: number,
  examScore: number,
  classStandingWeight = 60,
  examWeight = 40
): number {
  return Number(
    ((classStanding * classStandingWeight) / 100 + (examScore * examWeight) / 100).toFixed(2)
  )
}

export function computeLaboratoryGrade(
  categoryGrades: CategoryGradeResult[],
  labCategories: GradingCategoryDef[]
): number {
  let weightedSum = 0
  for (const cat of labCategories) {
    const gradeRecord = categoryGrades.find((cg) => cg.category === cat.name)
    if (gradeRecord) {
      weightedSum += gradeRecord.grade * (cat.weight / 100)
    }
  }
  return Number(weightedSum.toFixed(2))
}

export function computePeriodGrade(
  lectureGrade: number,
  laboratoryGrade: number | undefined,
  lectureWeight = 40,
  laboratoryWeight = 60
): number {
  if (laboratoryGrade === undefined) {
    return lectureGrade
  }
  return Number(
    (
      (lectureGrade * lectureWeight) / 100 +
      (laboratoryGrade * laboratoryWeight) / 100
    ).toFixed(2)
  )
}

export function computeFinalGrade(
  midtermGrade: number,
  tentativeFinalGrade: number
): number {
  return Number(((midtermGrade + tentativeFinalGrade) / 2).toFixed(2))
}

const DEFAULT_TRANSMUTATION: Record<string, number> = {
  "97-100": 1.0,
  "94-96": 1.25,
  "91-93": 1.5,
  "88-90": 1.75,
  "85-87": 2.0,
  "82-84": 2.25,
  "79-81": 2.5,
  "76-78": 2.75,
  "75": 3.0,
  "72-74": 4.0,
  "0-71": 5.0,
}

export function transmuteGrade(
  percentile: number,
  table?: Record<string, number>
): number {
  const map = table ?? DEFAULT_TRANSMUTATION
  for (const [range, equiv] of Object.entries(map)) {
    if (range.includes("-")) {
      const [low, high] = range.split("-").map(Number)
      if (percentile >= low && percentile <= high) return equiv
    } else {
      const val = Number(range)
      if (percentile >= val) return equiv
    }
  }
  return 5.0
}

export function getGradeRemarks(transmuted: number): string {
  if (transmuted <= 3.0) return "Passed"
  return "Failed"
}

export function computeStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const squaredDiffs = values.map((v) => (v - mean) ** 2)
  return Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / values.length)
}
