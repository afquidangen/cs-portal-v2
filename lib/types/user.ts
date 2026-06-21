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
  section?: string
  units?: number
  editReason?: string
  editedBy?: string
  editedAt?: string
}

export type SemesterGwaEntry = {
  semesterId: string
  semester: string
  schoolYearStart: number
  schoolYearEnd: number
  gwa: number | null
}

export type UserRecord = {
  id: string
  name: string
  email: string
  role: Role
  roles?: Role[]
  password?: string
  firstName?: string
  middleName?: string
  lastName?: string
  contactNumber?: string
  sex?: string
  birthday?: string
  address?: string
  photoUrl?: string
  studentType?: "Irregular" | "Regular" | "Transferee" | "Shifter"
  curriculum?: string
  curriculumId?: string
  currentYearLevel?: string
  currentSemester?: string
  gradeHistory?: GradeHistoryEntry[]
  semesterGwas?: SemesterGwaEntry[]
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
