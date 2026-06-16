import { GradingTemplateModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class GradingTemplateRepository extends BaseRepository {
  constructor() {
    super(GradingTemplateModel)
  }

  async findByClass(classId: string) {
    await this.connect()
    return this.model.find({ classId, isDeleted: { $ne: true } }).sort({ name: 1 }).lean()
  }

  private async connect() {
    const { connectToDatabase } = await import("@/lib/mongodb")
    await connectToDatabase()
  }
}

export const gradingTemplateRepository = new GradingTemplateRepository()
