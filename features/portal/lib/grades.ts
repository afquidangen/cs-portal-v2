import type { GradeRecord } from "../data/portal-data"

export const gradeRemarkOptions = [
  "Passed", "Failed", "INC", "Dropped", "Unofficial Drop",
]

const EQUIVALENT_GRADES = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 4.0, 5.0] as const
export type EquivalentGrade = (typeof EQUIVALENT_GRADES)[number]
export { EQUIVALENT_GRADES }

const DEFAULT_CLIENT_TABLE: Record<string, number> = {
  "97-100": 1.0, "94-96": 1.25, "91-93": 1.5, "88-90": 1.75,
  "85-87": 2.0, "82-84": 2.25, "79-81": 2.5, "76-78": 2.75,
  "75": 3.0, "72-74": 4.0, "0-71": 5.0,
}

export function transmutedToEquivalent(score: number): number {
  const entries = Object.entries(DEFAULT_CLIENT_TABLE).sort(([a], [b]) => {
    const aHigh = a.includes("-") ? Number(a.split("-")[1]) : Number(a)
    const bHigh = b.includes("-") ? Number(b.split("-")[1]) : Number(b)
    return bHigh - aHigh
  })
  for (const [range, equiv] of entries) {
    if (range.includes("-")) {
      const [low, high] = range.split("-").map(Number)
      if (score >= low && score <= high) return equiv
    } else {
      const val = Number(range)
      if (score >= val) return equiv
    }
  }
  return 5.0
}

export function equivalentToPercentage(equiv: number): number {
  const map: Record<number, number> = {
    1.0: 98.5, 1.25: 95.5, 1.5: 92.5, 1.75: 89.5,
    2.0: 86.5, 2.25: 83.5, 2.5: 80.5, 2.75: 77.5,
    3.0: 75.0, 4.0: 73.0, 5.0: 35.5,
  }
  return map[equiv] ?? 0
}

export function calculateFinalGrade(record: GradeRecord) {
  if (record.midtermTransmuted !== undefined && record.finalTransmuted !== undefined) {
    return Number(((record.midtermTransmuted + record.finalTransmuted) / 2).toFixed(2))
  }
  if (record.midterm !== undefined && record.finalTerm !== undefined) {
    return Number(((record.midterm + record.finalTerm) / 2).toFixed(2))
  }
  return 0
}

export function calculateGradePercentage(record: GradeRecord) {
  if (record.finalGrade !== undefined) return record.finalGrade
  if (record.gradePercentage !== undefined) return record.gradePercentage
  if (record.midtermGrade !== undefined && record.tentativeFinalGrade !== undefined) {
    return Number(((record.midtermGrade + record.tentativeFinalGrade) / 2).toFixed(2))
  }
  if (record.midtermTransmuted !== undefined && record.finalTransmuted !== undefined) {
    return Number(((record.midtermTransmuted + record.finalTransmuted) / 2).toFixed(2))
  }
  return undefined
}

export function gradeRemarks(grade: number, remarks?: string) {
  if (remarks && remarks !== "Passed") return remarks
  if (grade <= 1.5) return "Dean\'s List pace"
  if (grade <= 3) return "Passed"
  return "Needs remediation"
}

export type DeansListResult = {
  eligible: boolean
  gwa: number | null
  honors: "Dean's List" | null
  reasons: string[]
}

export function computeDeansList(
  grades: GradeRecord[],
  studentType?: string,
  yearLevel?: string
): DeansListResult {
  const reasons: string[] = []

  if (studentType === "Irregular") {
    return { eligible: false, gwa: null, honors: null, reasons: ["Irregular students are not eligible for Dean's List"] }
  }

  const filtered = grades.filter((g) => {
    if (yearLevel === "First Year" && g.code?.startsWith("NSTP")) return false
    return g.transmutedGrade !== undefined && g.released === true
  })

  if (filtered.length === 0) {
    return { eligible: false, gwa: null, honors: null, reasons: ["No graded subjects"] }
  }

  const gwa = Number((filtered.reduce((sum, g) => sum + (g.transmutedGrade ?? 0), 0) / filtered.length).toFixed(2))

  if (gwa > 1.75) {
    reasons.push(`GWA of ${gwa.toFixed(2)} exceeds the 1.75 threshold`)
  }

  const hasGradeAbove25 = filtered.some((g) => (g.transmutedGrade ?? 0) >= 2.50)
  if (hasGradeAbove25) {
    reasons.push("Has a grade of 2.50 or higher in a subject")
  }

  const disqualifyingRemarks = ["dropped", "inc", "failed", "d", "od"]
  const hasBadRemarks = grades.some((g) => {
    const r = (g.remarks || "").toLowerCase().trim()
    return disqualifyingRemarks.some((d) => r === d || r.startsWith(d))
  })
  if (hasBadRemarks) {
    reasons.push("Has a Dropped, INC, or Failed grade")
  }

  if (reasons.length > 0) {
    return { eligible: false, gwa, honors: null, reasons }
  }

  return { eligible: true, gwa, honors: "Dean's List", reasons: [] }
}
