import { GradeColumnModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class GradeColumnRepository extends BaseRepository {
  constructor() {
    super(GradeColumnModel)
  }

  async findByClass(classId: string) {
    await this.connect()
    return this.model.find({ classId, isDeleted: { $ne: true } }).sort({ order: 1 }).lean()
  }

  private async connect() {
    const { connectToDatabase } = await import("@/lib/mongodb")
    await connectToDatabase()
  }
}

export const gradeColumnRepository = new GradeColumnRepository()
