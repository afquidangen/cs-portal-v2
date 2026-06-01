import type { GradeRecord } from "../data/portal-data"

export const gradeRemarkOptions = [
  "Passed",
  "INC",
  "Dropped",
  "Unofficial Dropped",
]

export function transmutedToEquivalent(score: number) {
  if (score >= 99) return 1
  if (score >= 96) return 1.25
  if (score >= 93) return 1.5
  if (score >= 90) return 1.75
  if (score >= 87) return 2
  if (score >= 84) return 2.25
  if (score >= 81) return 2.5
  if (score >= 78) return 2.75
  if (score >= 75) return 3
  return 5
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
  return undefined
}

export function gradeRemarks(grade: number, remarks?: string) {
  if (remarks && remarks !== "Passed") return remarks
  if (grade <= 1.5) return "Dean's List pace"
  if (grade <= 3) return "Passed"
  return "Needs remediation"
}
