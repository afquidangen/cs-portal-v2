export type GradingTemplate = {
  id: string
  name: string
  classId: string
  subjectType: "Lecture" | "Lecture with Lab"
  columns: Array<{
    name: string
    category: string
    maxScore: number
    order: number
  }>
  createdAt: string
  updatedAt: string
}
