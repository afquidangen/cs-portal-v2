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
      $or: [{ title: regex }, { authors: regex }, { tags: regex }],
    }).lean()
  }
}

export const thesesRepository = new ThesesRepository()
