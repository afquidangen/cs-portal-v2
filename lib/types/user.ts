import type { Role } from "./common"

export type GradeHistoryEntry = {
  subjectCode: string
  subjectName: string
  finalPercentile: number
  transmutedGrade: number
  remarks: string
  curriculumId: string
  yearLevel: string
  semester: string
}

export type UserRecord = {
  id: string
  name: string
  email: string
  role: Role
  password?: string
  firstName?: string
  middleName?: string
  lastName?: string
  contactNumber?: string
  sex?: string
  birthday?: string
  address?: string
  photoUrl?: string
  studentType?: "Irregular" | "Regular" | "Overstayed" | "Transferee" | "Shifter"
  curriculum?: string
  curriculumId?: string
  currentYearLevel?: string
  currentSemester?: string
  gradeHistory?: GradeHistoryEntry[]
  advisoryClass?: string
  employmentType?: "Part Time" | "Regular"
  academicTitle?: string
  course?: string
  year?: number
  section?: string
  position?: string
  status: "Active" | "Inactive"
  createdAt?: string
  updatedAt?: string
}
