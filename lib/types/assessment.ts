export type AssessmentScore = {
  studentId: string
  score: number
}

export type Assessment = {
  id: string
  classId: string
  name: string
  category: string
  maxScore: number
  scores: AssessmentScore[]
  archived: boolean
  createdAt: string
  updatedAt: string
}
