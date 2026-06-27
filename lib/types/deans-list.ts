export type DeansListEntry = {
  id: string
  studentId: string
  studentName: string
  semesterId: string
  semester: string
  schoolYearStart: number
  schoolYearEnd: number
  gwa: number | null
  totalUnits: number
  yearLevel: string
  isQualified: boolean
  disqualificationReasons: string[]
  manualOverride: "none" | "include" | "exclude"
  rank: number | null
  published: boolean
  publishedAt: string | null
  needsRecalculation: boolean
}
