import { GradingSchemeModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class GradingSchemeRepository extends BaseRepository {
  constructor() {
    super(GradingSchemeModel)
  }

  async findActiveBySubjectType(subjectType: "Lecture" | "Lecture with Lab") {
    return this.findOne({ isActive: true, subjectType })
  }

  async setDefaultScheme(schemeId: string) {
    await GradingSchemeModel.updateMany({}, { isDefault: false })
    return this.update({ id: schemeId }, { isDefault: true })
  }
}

export const gradingSchemeRepository = new GradingSchemeRepository()
