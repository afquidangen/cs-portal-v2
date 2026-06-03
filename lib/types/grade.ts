export type GradeRecord = {
  id: string
  studentId: string
  student: string
  section: string
  subject: string
  code: string
  units: number
  midtermTransmuted?: number
  midterm: number
  finalTransmuted?: number
  finalTerm: number
  gradePercentage?: number
  remarks?: string
  released?: boolean
  updatedAt: string
  createdAt?: string
}
