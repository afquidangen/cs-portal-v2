export type CsoReport = {
  id: string
  title: string
  type: "Event" | "Accomplishment" | "Financial" | "Record"
  date: string
  summary: string
  total?: string
  image?: string
  cloudinaryPublicId?: string
  createdAt?: string
  updatedAt?: string
}
