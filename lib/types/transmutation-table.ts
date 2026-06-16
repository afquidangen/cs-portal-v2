export type TransmutationEntry = {
  min: number
  max: number
  equivalent: number
}

export type TransmutationTable = {
  id: string
  name: string
  subjectType: "Lecture" | "Lecture with Lab" | "All"
  isDefault: boolean
  isActive: boolean
  entries: TransmutationEntry[]
  createdAt: string
  updatedAt: string
}
