export type SemesterRecord = {
  id: string
  semester: "First Semester" | "Midyear" | "Second Semester"
  schoolYearStart: number
  schoolYearEnd: number
  status: "Active" | "Inactive"
  createdAt?: string
  updatedAt?: string
}
