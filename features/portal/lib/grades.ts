import type { GradeRecord } from "../data/portal-data"

export const gradeRemarkOptions = [
  "Passed",
  "Failed",
  "INC",
  "Dropped",
  "Unofficial Drop",
]

const EQUIVALENT_GRADES = [1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 4.0, 5.0] as const
export type EquivalentGrade = (typeof EQUIVALENT_GRADES)[number]
export { EQUIVALENT_GRADES }

export function transmutedToEquivalent(score: number) {
  if (score >= 97) return 1
  if (score >= 94) return 1.25
  if (score >= 91) return 1.5
  if (score >= 88) return 1.75
  if (score >= 85) return 2
  if (score >= 82) return 2.25
  if (score >= 79) return 2.5
  if (score >= 76) return 2.75
  if (score >= 75) return 3
  if (score >= 72) return 4
  return 5
}

export function equivalentToPercentage(equiv: number): number {
  const map: Record<number, number> = {
    1.0: 98.5,
    1.25: 95.5,
    1.5: 92.5,
    1.75: 89.5,
    2.0: 86.5,
    2.25: 83.5,
    2.5: 80.5,
    2.75: 77.5,
    3.0: 75.0,
    4.0: 73.0,
    5.0: 35.5,
  }
  return map[equiv] ?? 0
}

export function calculateFinalGrade(record: GradeRecord) {
  return Number(((record.midterm + record.finalTerm) / 2).toFixed(2))
}

export function calculateGradePercentage(record: GradeRecord) {
  if (record.gradePercentage !== undefined) return record.gradePercentage
  if (
    record.midtermTransmuted !== undefined &&
    record.finalTransmuted !== undefined
  ) {
    return Number(
      ((record.midtermTransmuted + record.finalTransmuted) / 2).toFixed(2)
    )
  }
  if (record.midterm !== undefined && record.finalTerm !== undefined) {
    return Number(
      ((record.midterm + record.finalTerm) / 2).toFixed(2)
    )
  }
  return undefined
}

export function gradeRemarks(grade: number, remarks?: string) {
  if (remarks && remarks !== "Passed") return remarks
  if (grade <= 1.5) return "Dean's List pace"
  if (grade <= 3) return "Passed"
  return "Needs remediation"
}
