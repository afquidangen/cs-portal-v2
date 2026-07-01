import { connectToDatabase } from "@/lib/mongodb"
import { AuditLogModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class AuditLogsRepository extends BaseRepository {
  constructor() {
    super(AuditLogModel)
  }

  async findAll(
    filter: Record<string, unknown> = {},
    includeDeleted = false
  ): Promise<unknown[]> {
    await connectToDatabase()
    const query = includeDeleted
      ? filter
      : { ...filter, isDeleted: { $ne: true } }
    return this.model.find(query).sort({ createdAt: -1 }).lean()
  }
}

export const auditLogsRepository = new AuditLogsRepository()
