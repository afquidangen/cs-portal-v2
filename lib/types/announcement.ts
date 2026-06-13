export type Announcement = {
  id: string
  title: string
  content: string
  date: string
  audience: string
  priority: "High" | "Medium" | "Low"
  classSection?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}
