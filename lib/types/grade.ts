export type CategoryGrade = {
  category: string
  totalStudentScore: number
  totalPossibleScore: number
  percentageScore: number
  weightedScore: number
  grade: number
}

export type GradeWorkflowStatus = "Draft" | "Submitted" | "Reviewed" | "Approved" | "Locked"

export type ReleaseHistoryEntry = {
  action: "released" | "unreleased" | "re-released"
  reason?: string
  timestamp: string
}

export type GradeRecord = {
  id: string
  studentId: string
  student: string
  section: string
  subject: string
  code: string
  units: number
  classId?: string
  semesterId?: string
  subjectType?: "Lecture" | "Lecture with Lab"

  scores?: Record<string, number>
  maxScores?: Record<string, number>

  categoryGrades?: CategoryGrade[]
  lectureClassStanding?: number
  lectureExam?: number
  lectureGrade?: number
  laboratoryGrade?: number

  midtermClassStanding?: number
  midtermExam?: number
  midtermLaboratoryGrade?: number
  midtermGrade?: number

  finalClassStanding?: number
  finalExam?: number
  finalLaboratoryGrade?: number
  tentativeFinalGrade?: number

  finalGrade?: number
  transmutedGrade?: number
  remarks?: string
  midtermRemarks?: string
  finalRemarks?: string

  midtermTransmuted?: number
  midterm?: number
  finalTransmuted?: number
  finalTerm?: number
  gradePercentage?: number

  midtermReleased?: boolean
  finalReleased?: boolean
  midtermReleaseHistory?: ReleaseHistoryEntry[]
  finalReleaseHistory?: ReleaseHistoryEntry[]
  workflowStatus?: GradeWorkflowStatus
  released?: boolean
  gradingSchemeId?: string
  semesterId?: string

  updatedAt: string
  deletedAt?: string | null
  createdAt?: string
}
