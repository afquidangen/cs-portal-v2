import { ThesisModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"
import { BaseRepository } from "./base.repository"

export class ThesesRepository extends BaseRepository {
  constructor() {
    super(ThesisModel)
  }

  async findByYear(year: number) {
    return this.findAll({ year })
  }

  async search(query: string) {
    await connectToDatabase()
    const regex = new RegExp(query, "i")
    return ThesisModel.find({
      isDeleted: { $ne: true },
      $or: [{ title: regex }, { authors: regex }, { tags: regex }],
    }).lean()
  }

  async findTrashed(): Promise<unknown[]> {
    await connectToDatabase()
    return ThesisModel.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean()
  }
}

export const thesesRepository = new ThesesRepository()
