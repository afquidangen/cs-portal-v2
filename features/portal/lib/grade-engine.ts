export type GradingCategoryDef = {
  name: string
  weight: number
  isAttendance?: boolean
  penaltyPerAbsence?: number
}

export type SchemeComponentDef = {
  name: string
  weight: number
  categories: GradingCategoryDef[]
  isExam?: boolean
}

export type GradeInput = {
  scores: Record<string, number>
  categoryGrades?: Record<string, { totalStudentScore: number; totalPossibleScore: number; percentageScore: number; weightedScore: number }>
}

export type CategoryGradeResult = {
  category: string
  totalStudentScore: number
  totalPossibleScore: number
  percentageScore: number
  weightedScore: number
  grade: number
}

export type ComputedGrades = {
  categoryGrades: CategoryGradeResult[]
  classStanding?: number
  examGrade?: number
  lectureGrade?: number
  laboratoryGrade?: number
  periodGrade: number
  finalGrade?: number
  transmutedGrade?: number
}

const CATEGORY_ALIASES: Record<string, string[]> = {
  quizzes: ["quiz", "quizzes"],
  quiz: ["quiz", "quizzes"],
  "performance recitation": ["performance", "recitation", "recit", "performance recitation"],
  performance: ["performance", "recitation", "recit", "performance recitation"],
  assignment: ["assignment", "assignments", "homework", "task", "activity", "activities", "seatwork"],
  assignments: ["assignment", "assignments", "homework", "task", "activity", "activities", "seatwork"],
  activities: ["assignment", "assignments", "activity", "activities", "homework", "task", "seatwork"],
  activity: ["assignment", "assignments", "activity", "activities", "homework", "task", "seatwork"],
  attendance: ["attendance", "attend", "atten", "att", "lec attendance", "lecture attendance", "lab attendance", "laboratory attendance"],
  "lec attendance": ["lec attendance", "lecture attendance", "lec attend", "lecture attend", "attendance", "attend"],
  "lecture attendance": ["lecture attendance", "lec attendance", "lecture attend", "lec attend", "attendance", "attend"],
  "lab attendance": ["lab attendance", "laboratory attendance", "lab attend", "laboratory attend", "attendance", "attend"],
  "laboratory attendance": ["laboratory attendance", "lab attendance", "laboratory attend", "lab attend", "attendance", "attend"],
  exam: ["exam", "midterm exam", "final exam", "prelim exam"],
  exercises: ["exercise", "exercises", "lab quiz", "lab quizzes"],
  exercise: ["exercise", "exercises", "lab quiz", "lab quizzes"],
  "lab quiz": ["exercise", "exercises", "lab quiz", "lab quizzes"],
  "work attitude": ["work attitude", "attitude", "lab activity", "lab activities"],
  "lab activities": ["work attitude", "attitude", "lab activity", "lab activities"],
  project: ["project", "proj", "pro", "mco"],
  mco: ["project", "proj", "pro", "mco"],
}

export function normalizeGradeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function categoryTokens(name: string): string[] {
  const normalized = normalizeGradeCategoryName(name)
  return CATEGORY_ALIASES[normalized] ?? [normalized]
}

export function gradeCategoryMatches(targetCategory: string, sourceCategory: string): boolean {
  const targetTokens = categoryTokens(targetCategory)
  const source = normalizeGradeCategoryName(sourceCategory)
  return targetTokens.includes(source)
}

function findCategoryGrade(
  categoryGrades: CategoryGradeResult[],
  categoryName: string
): CategoryGradeResult | undefined {
  return categoryGrades.find((cg) => gradeCategoryMatches(categoryName, cg.category))
}

function findMatchingCategory(
  categories: Array<{ name: string }>,
  sourceCategory: string
): string | undefined {
  return categories.find((cat) => gradeCategoryMatches(cat.name, sourceCategory))?.name
}

export function computeCategoryGrade(
  totalStudentScore: number,
  totalPossibleScore: number,
  categoryWeight?: number,
  useSimpleWs?: boolean
): { percentageScore: number; weightedScore: number; grade: number } {
  if (totalPossibleScore === 0) {
    const w = categoryWeight ?? 0
    return { percentageScore: 0, weightedScore: 50 * w, grade: 0 }
  }
  const percentageScore = totalStudentScore / totalPossibleScore
  const grade = percentageScore * 100
  let weightedScore: number
  if (categoryWeight !== undefined) {
    weightedScore = useSimpleWs
      ? percentageScore * 100 * categoryWeight
      : (percentageScore * 50 + 50) * categoryWeight
  } else {
    weightedScore = grade
  }
  return { percentageScore, weightedScore, grade }
}

export function computeAllCategoryGrades(
  assessmentsByCategory: Record<string, { studentScores: number[]; maxScores: number[] }>,
  categoryWeights?: Record<string, number>,
  absencesMap?: Record<string, number>,
  categories?: GradingCategoryDef[]
): CategoryGradeResult[] {
  if (categoryWeights) {
    for (const catName of Object.keys(categoryWeights)) {
      const catDef = categories?.find((c) => c.name === catName)
      const catKey = catName.toLowerCase().replace(/[^a-z0-9]/g, "")
      const isAttendance = catDef?.isAttendance ?? (catKey.includes("attendance") || catKey.includes("attend"))
      if (isAttendance && !assessmentsByCategory[catName]) {
        assessmentsByCategory[catName] = { studentScores: [], maxScores: [] }
      }
    }
  }
  return Object.entries(assessmentsByCategory).map(([category, data]) => {
    const totalPossibleScore = data.maxScores.reduce((sum, s) => sum + s, 0)
    const catKey = category.toLowerCase().replace(/[^a-z0-9]/g, "")
    const catDef = categories?.find((c) => c.name === category)
    const isAttendance = catDef?.isAttendance ?? (catKey.includes("attendance") || catKey.includes("attend"))
    const weight = categoryWeights?.[category]
    const constantMax = isAttendance
      ? (catDef?.weight ?? weight ?? 0)
      : totalPossibleScore
    const absences = absencesMap?.[catKey] ?? 0
    const penaltyPerAbsence = catDef?.penaltyPerAbsence ?? 0.6
    const totalStudentScore = isAttendance
      ? Math.max(0, constantMax - absences * penaltyPerAbsence)
      : data.studentScores.reduce((sum, s) => sum + s, 0)
    const catWeight = weight !== undefined ? weight / 100 : undefined
    const useSimpleWs = isAttendance
    const { percentageScore, weightedScore, grade } = computeCategoryGrade(
      totalStudentScore, constantMax, catWeight, useSimpleWs
    )
    return { category, totalStudentScore, totalPossibleScore: constantMax, percentageScore, weightedScore, grade }
  })
}

export function computeClassStandingRange(categories: GradingCategoryDef[]): { min: number; max: number } {
  const min = categories.reduce((s, c) => s + 50 * (c.weight / 100), 0)
  const max = categories.reduce((s, c) => s + 100 * (c.weight / 100), 0)
  return { min, max }
}

export function computeClassStanding(
  categoryGrades: CategoryGradeResult[],
  categories: GradingCategoryDef[]
): number {
  if (categories.length === 0) return 0
  let rawSum = 0
  for (const cat of categories) {
    const gradeRecord = findCategoryGrade(categoryGrades, cat.name)
    if (gradeRecord) {
      rawSum += gradeRecord.weightedScore
    } else {
      const name = normalizeGradeCategoryName(cat.name)
      if (cat.isAttendance ?? CATEGORY_ALIASES.attendance.includes(name)) {
        rawSum += 100 * (cat.weight / 100)
      }
    }
  }
  return rawSum
}

export function computeLectureGrade(
  classStanding: number,
  examScore: number,
  classStandingWeight = 60,
  examWeight = 40
): number {
  return (classStanding * classStandingWeight) / 100 + (examScore * examWeight) / 100
}

export function computeLaboratoryGrade(
  categoryGrades: CategoryGradeResult[],
  labCategories: GradingCategoryDef[]
): number {
  if (labCategories.length === 0) return 0
  let rawSum = 0
  for (const cat of labCategories) {
    const gradeRecord = findCategoryGrade(categoryGrades, cat.name)
    if (gradeRecord) {
      rawSum += gradeRecord.weightedScore
    } else {
      const name = normalizeGradeCategoryName(cat.name)
      if (cat.isAttendance ?? CATEGORY_ALIASES.attendance.includes(name)) {
        rawSum += 100 * (cat.weight / 100)
      }
    }
  }
  return rawSum
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
  return (lectureGrade * lectureWeight) / 100 + (laboratoryGrade * laboratoryWeight) / 100
}

export function computeFinalGrade(
  midtermGrade: number,
  tentativeFinalGrade: number
): number {
  return (midtermGrade + tentativeFinalGrade) / 2
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
  const pct = Math.round(percentile)
  const map = table ?? DEFAULT_TRANSMUTATION
  const entries = Object.entries(map).sort(([a], [b]) => {
    const aHigh = a.includes("-") ? Number(a.split("-")[1]) : Number(a)
    const bHigh = b.includes("-") ? Number(b.split("-")[1]) : Number(b)
    return bHigh - aHigh
  })
  for (const [range, equiv] of entries) {
    if (range.includes("-")) {
      const [low, high] = range.split("-").map(Number)
      if (pct >= low && pct <= high) return equiv
    } else {
      const val = Number(range)
      if (pct >= val && pct <= val) return equiv
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

export function computeExamGrade(
  assessmentsOrColumns: Array<{ maxScore: number; studentScore: number }>
): number {
  if (assessmentsOrColumns.length === 0) return 0
  const totalStudentScore = assessmentsOrColumns.reduce((s, a) => s + a.studentScore, 0)
  const totalPossibleScore = assessmentsOrColumns.reduce((s, a) => s + a.maxScore, 0)
  if (totalPossibleScore === 0) return 0
  return (totalStudentScore / totalPossibleScore) * 50 + 50
}

function buildComponentAssessments(
  categories: Array<{ name: string }>,
  columns: Array<{ name: string; category: string; maxScore: number; gradingPeriod?: string }>,
  assessments: Array<{ name: string; category: string; maxScore: number; scores: Array<{ studentId: string; score: number }> }>,
  studentId: string,
  scores: Record<string, number>
): Record<string, { studentScores: number[]; maxScores: number[] }> {
  const result: Record<string, { studentScores: number[]; maxScores: number[] }> = {}

  for (const col of columns) {
    const categoryName = findMatchingCategory(categories, col.category)
    if (!categoryName) continue
    if (!result[categoryName]) {
      result[categoryName] = { studentScores: [], maxScores: [] }
    }
    const key = col.gradingPeriod && col.gradingPeriod !== "both"
      ? `${col.gradingPeriod}_${col.name}`
      : col.name
    result[categoryName].studentScores.push(scores[key] ?? scores[col.name] ?? 0)
    result[categoryName].maxScores.push(col.maxScore)
  }

  for (const asm of assessments) {
    const categoryName = findMatchingCategory(categories, asm.category)
    if (!categoryName) continue
    if (!result[categoryName]) {
      result[categoryName] = { studentScores: [], maxScores: [] }
    }
    const studentScore = asm.scores.find((s) => s.studentId === studentId)?.score ?? 0
    result[categoryName].studentScores.push(studentScore)
    result[categoryName].maxScores.push(asm.maxScore)
  }

  return result
}

function buildCategoryWeightMap(categories: GradingCategoryDef[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const cat of categories) {
    map[cat.name] = cat.weight
  }
  return map
}

export function computeLivePreview(params: {
  scores: Record<string, number>
  columns: Array<{ name: string; category: string; maxScore: number; gradingPeriod?: string }>
  assessments: Array<{ name: string; category: string; maxScore: number; scores: Array<{ studentId: string; score: number }> }>
  studentId: string
  components: SchemeComponentDef[]
  labComponents?: SchemeComponentDef[]
  subjectType: "Lecture" | "Lecture with Lab"
  lectureWeight?: number
  laboratoryWeight?: number
  midtermGrade?: number
  period?: "midterm" | "final"
}): {
  categoryGrades: CategoryGradeResult[]
  classStanding: number
  examGrade: number
  lectureGrade: number
  laboratoryGrade?: number
  periodGrade: number
  finalGrade?: number
  transmutedGrade?: number
} {
  const { scores, columns, assessments, studentId, components, labComponents, subjectType, lectureWeight, laboratoryWeight, midtermGrade, period = "midterm" } = params

  const absencesMap: Record<string, number> = {}
  for (const [key, val] of Object.entries(scores)) {
    if (key.startsWith(`${period}_absences_`)) {
      absencesMap[key.replace(`${period}_absences_`, "")] = Number(val) || 0
    }
  }

  const standingComponent = components.find(
    (c) => c.isExam === false
  ) || components.find(
    (c) => c.name.toLowerCase().includes("class standing") || c.name.toLowerCase().includes("lecture class standing")
  ) || components[0]
  const examComponent = components.find(
    (c) => c.isExam === true
  ) || components.find(
    (c) => c.name.toLowerCase().includes("exam")
  ) || components[1]

  const standingCategories = standingComponent?.categories || []
  const examCategories = examComponent?.categories || []
  const standingWeight = standingComponent?.weight ?? 60
  const examWeight = examComponent?.weight ?? 40

  function isExamItem(category: string): boolean {
    return examCategories.some((cat) => gradeCategoryMatches(cat.name, category))
  }

  let classStanding: number
  let examGrade: number
  let laboratoryGrade: number | undefined
  let categoryGrades: CategoryGradeResult[] = []

  if (subjectType === "Lecture with Lab" && labComponents && labComponents.length > 0) {
    const labComponent = labComponents.find(
      (c) => c.name.toLowerCase().includes("laboratory") || c.name === "Laboratory"
    ) || labComponents[0]

    const labCategories = labComponent?.categories || []

    const lectureAssessments = buildComponentAssessments(
      standingCategories,
      columns.filter((c) => !isExamItem(c.category)),
      assessments.filter((a) => !isExamItem(a.category)),
      studentId,
      scores
    )
    const lectureWeights = buildCategoryWeightMap(standingCategories)
    const lectureCategoryGrades = computeAllCategoryGrades(lectureAssessments, lectureWeights, absencesMap, standingCategories)

    const labAssessments = buildComponentAssessments(
      labCategories,
      columns,
      assessments,
      studentId,
      scores
    )
    const labWeights = buildCategoryWeightMap(labCategories)
    const labCategoryGrades = computeAllCategoryGrades(labAssessments, labWeights, absencesMap, labCategories)

    const examItems: Array<{ maxScore: number; studentScore: number }> = []
    for (const col of columns.filter((c) => isExamItem(c.category))) {
      const key = col.gradingPeriod && col.gradingPeriod !== "both"
        ? `${col.gradingPeriod}_${col.name}`
        : col.name
      examItems.push({
        maxScore: col.maxScore,
        studentScore: scores[key] ?? scores[col.name] ?? 0,
      })
    }
    for (const asm of assessments.filter((a) => isExamItem(a.category))) {
      examItems.push({
        maxScore: asm.maxScore,
        studentScore: asm.scores.find((s) => s.studentId === studentId)?.score ?? 0,
      })
    }

    categoryGrades = [...lectureCategoryGrades, ...labCategoryGrades]
    classStanding = computeClassStanding(lectureCategoryGrades, standingCategories)
    examGrade = computeExamGrade(examItems)
    laboratoryGrade = computeLaboratoryGrade(labCategoryGrades, labCategories)
  } else {
    const assessmentsByCategory = buildComponentAssessments(
      standingCategories,
      columns.filter((c) => !isExamItem(c.category)),
      assessments.filter((a) => !isExamItem(a.category)),
      studentId,
      scores
    )
    const catWeights = buildCategoryWeightMap(standingCategories)
    categoryGrades = computeAllCategoryGrades(assessmentsByCategory, catWeights, absencesMap, standingCategories)
    classStanding = computeClassStanding(categoryGrades, standingCategories)

    const examItems: Array<{ maxScore: number; studentScore: number }> = []
    for (const col of columns.filter((c) => isExamItem(c.category))) {
      const key = col.gradingPeriod && col.gradingPeriod !== "both"
        ? `${col.gradingPeriod}_${col.name}`
        : col.name
      examItems.push({
        maxScore: col.maxScore,
        studentScore: scores[key] ?? scores[col.name] ?? 0,
      })
    }
    for (const asm of assessments.filter((a) => isExamItem(a.category))) {
      examItems.push({
        maxScore: asm.maxScore,
        studentScore: asm.scores.find((s) => s.studentId === studentId)?.score ?? 0,
      })
    }
    examGrade = computeExamGrade(examItems)
  }

  const lectureGrade = computeLectureGrade(classStanding, examGrade, standingWeight, examWeight)

  const periodGrade = computePeriodGrade(lectureGrade, laboratoryGrade, lectureWeight, laboratoryWeight)

  let finalGrade: number | undefined
  let transmutedGrade: number | undefined

  if (midtermGrade !== undefined && midtermGrade > 0) {
    finalGrade = computeFinalGrade(midtermGrade, periodGrade)
    transmutedGrade = transmuteGrade(finalGrade)
  }

  return {
    categoryGrades,
    classStanding,
    examGrade,
    lectureGrade,
    laboratoryGrade,
    periodGrade,
    finalGrade,
    transmutedGrade,
  }
}

export function findCurriculumSubjectPosition(
  curriculum: {
    terms: Array<{ year: string; semester: string; subjects: Array<{ code: string }> }>
  } | null,
  subjectCode: string
): { yearLevel: string; semester: string } | null {
  if (!curriculum) return null
  for (const term of curriculum.terms) {
    for (const sub of term.subjects) {
      if (sub.code === subjectCode) {
        return { yearLevel: term.year, semester: term.semester }
      }
    }
  }
  return null
}
