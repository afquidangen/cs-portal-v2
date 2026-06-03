export type AuditLogRecord = {
  id: string
  actor: string
  action: string
  time: string
  createdAt?: string
  updatedAt?: string
}
