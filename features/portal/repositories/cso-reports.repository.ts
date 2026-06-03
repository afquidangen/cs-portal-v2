import { CsoReportModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class CsoReportsRepository extends BaseRepository {
  constructor() {
    super(CsoReportModel)
  }

  async findByType(type: string) {
    return this.findAll({ type })
  }
}

export const csoReportsRepository = new CsoReportsRepository()
