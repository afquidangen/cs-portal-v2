import type { AvailabilityStatus } from "./common"

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
  createdAt?: string
  updatedAt?: string
}
