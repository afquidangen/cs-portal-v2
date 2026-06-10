import type { TicketStatus } from "./common"

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
  resolvedAt?: string
  anonymous: boolean
  createdAt?: string
  updatedAt?: string
}
