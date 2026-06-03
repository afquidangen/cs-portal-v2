import { AnnouncementModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"
import { BaseRepository } from "./base.repository"

export class AnnouncementsRepository extends BaseRepository {
  constructor() {
    super(AnnouncementModel)
  }

  async findRecent(limit = 5) {
    await connectToDatabase()
    return AnnouncementModel.find().sort({ date: -1 }).limit(limit).lean()
  }
}

export const announcementsRepository = new AnnouncementsRepository()
