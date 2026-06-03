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
  createdAt?: string
  updatedAt?: string
}
