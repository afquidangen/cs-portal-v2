import { NewsModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"
import { BaseRepository } from "./base.repository"

export class NewsRepository extends BaseRepository {
  constructor() {
    super(NewsModel)
  }

  async findLatest(limit = 5) {
    await connectToDatabase()
    return NewsModel.find().sort({ id: -1 }).limit(limit).lean()
  }
}

export const newsRepository = new NewsRepository()
