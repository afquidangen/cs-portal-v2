export type CategoryGrade = {
  category: string
  totalStudentScore: number
  totalPossibleScore: number
  grade: number
}

export type GradeWorkflowStatus = "Draft" | "Submitted" | "Reviewed" | "Approved" | "Locked"

export type GradeRecord = {
  id: string
  studentId: string
  student: string
  section: string
  subject: string
  code: string
  units: number
  classId: string
  subjectType: "Lecture" | "Lecture with Lab"

  scores: Record<string, number>

  categoryGrades: CategoryGrade[]
  lectureClassStanding?: number
  lectureExam?: number
  lectureGrade?: number
  laboratoryGrade?: number
  midtermGrade?: number
  tentativeFinalGrade?: number
  finalGrade?: number
  transmutedGrade?: number
  remarks?: string

  workflowStatus: GradeWorkflowStatus
  released: boolean
  gradingSchemeId?: string

  updatedAt: string
  deletedAt?: string | null
  createdAt?: string
}
