export type NotificationLog = {
  id: string
  type: "grade_released" | "announcement"
  studentId?: string
  email: string
  announcementId?: string
  status: "sent" | "failed"
  timestamp: string
  errorMessage?: string
}
