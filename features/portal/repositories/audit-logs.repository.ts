import { AuditLogModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class AuditLogsRepository extends BaseRepository {
  constructor() {
    super(AuditLogModel)
  }
}

export const auditLogsRepository = new AuditLogsRepository()
