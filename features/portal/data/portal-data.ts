export type Role = "student" | "faculty" | "admin"

export type AvailabilityStatus =
  | "Available"
  | "In Class"
  | "Consultation Only"
  | "Out of Office"

export type TicketStatus = "Pending" | "In Progress" | "Resolved"

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
  lastLogin?: string
}

export type FacultyRecord = {
  id: string
  name: string
  position: string
  role: string
  email: string
  education: string
  status: AvailabilityStatus
  notes: string
  schedule: string[]
}

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
}

export type ThesisRecord = {
  id: string
  title: string
  authors: string
  year: number
  category: string
  adviser: string
  abstract: string
  tags: string[]
  pdfUrl: string
  fileName: string
}

export type ProfileDetails = {
  photoUrl: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  contactNumber: string
  sex: string
  birthday: string
  address: string
}

export type SeminarRecord = {
  id: string
  title: string
  speaker: string
  date: string
  location: string
  description: string
  capacity: number
  enlistedStudentIds: string[]
  host: string
  status: "Active" | "Closed"
}

export type FeedbackTicket = {
  id: string
  studentId?: string
  studentName: string
  category: string
  subject: string
  description: string
  status: TicketStatus
  submittedAt: string
  assignedTo: string
  resolution?: string
  anonymous: boolean
}

export type Announcement = {
  id: string
  title: string
  content: string
  date: string
  audience: string
  priority: "High" | "Medium" | "Low"
}

export type ScheduleItem = {
  id: string
  semesterId: string
  day: string
  time: string
  subject: string
  room: string
  instructor: string
  section: string
}

export type CurriculumTerm = {
  year: string
  semester: string
  subjects: {
    code: string
    name: string
    lec: number
    lab: number
    total: number
  }[]
}

export type CurriculumRecord = {
  id: string
  name: string
  major: string
  status: "Active" | "Archived"
  totalUnits: number
  terms: {
    year: string
    semester: string
    subjects: {
      code: string
      name: string
      lec: number
      lab: number
      total: number
    }[]
  }[]
}

export type ClassStudent = {
  id: string
  name: string
  section: string
  enrolled: boolean
}

export type CsoReport = {
  id: string
  title: string
  type: "Event" | "Accomplishment" | "Financial" | "Record"
  date: string
  summary: string
  total?: string
  image?: string
}

export const availabilityOptions: AvailabilityStatus[] = [
  "Available",
  "Consultation Only",
  "In Class",
  "Out of Office",
]

export const ticketStatusOptions: TicketStatus[] = [
  "Pending",
  "In Progress",
  "Resolved",
]
