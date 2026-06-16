import { TransmutationTableModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class TransmutationTableRepository extends BaseRepository {
  constructor() {
    super(TransmutationTableModel)
  }

  async findActiveBySubjectType(subjectType: "Lecture" | "Lecture with Lab" | "All" = "All") {
    return this.findOne({ isActive: true, subjectType })
  }

  async setDefaultTable(tableId: string) {
    await TransmutationTableModel.updateMany({}, { isDefault: false })
    return this.update({ id: tableId }, { isDefault: true })
  }
}

export const transmutationTableRepository = new TransmutationTableRepository()
