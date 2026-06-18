import { TransmutationTableModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class TransmutationTableRepository extends BaseRepository {
  constructor() {
    super(TransmutationTableModel)
  }

  async findActiveBySubjectType(subjectType: "Lecture" | "Lecture with Lab" | "All" = "All") {
    const exact = await this.findOne({ isActive: true, subjectType })
    if (exact) return exact
    return this.findOne({ isActive: true, subjectType: "All" })
  }

  async setDefaultTable(tableId: string) {
    await TransmutationTableModel.updateMany({}, { isDefault: false })
    return this.update({ id: tableId }, { isDefault: true })
  }
}

export const transmutationTableRepository = new TransmutationTableRepository()
