export type GradingPeriod = "midterm" | "final" | "both"

export type GradeColumn = {
  id: string
  classId: string
  name: string
  category: string
  gradingPeriod: GradingPeriod
  maxScore: number
  order: number
  width?: number
  displayName?: string
  createdAt: string
  updatedAt: string
}