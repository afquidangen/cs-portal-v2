import type { GradeRecord } from "../data/portal-data"

export function calculateFinalGrade(record: GradeRecord) {
  return Number(((record.midterm + record.finalTerm) / 2).toFixed(2))
}

export function calculatePercentage(record: GradeRecord) {
  const midtermWeight = 0.5
  const finalWeight = 0.5
  return Number(((record.midterm * midtermWeight + record.finalTerm * finalWeight) * 20).toFixed(2))
}

export function gradeRemarks(grade: number) {
  if (grade <= 1.5) return "Dean's List pace"
  if (grade <= 3) return "Passed"
  return "Needs remediation"
}
