export type SemesterRecord = {
  id: string
  semester: "First Semester" | "Midyear" | "Second Semester"
  schoolYearStart: number
  schoolYearEnd: number
  status: "Active" | "Inactive" | "Archived"
  gradingPeriod: "Midterm" | "Final"
  endDate?: string
  archivedAt?: string
  createdAt?: string
  updatedAt?: string
}
