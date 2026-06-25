import { AnnouncementModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"
import { BaseRepository } from "./base.repository"

export class AnnouncementsRepository extends BaseRepository {
  constructor() {
    super(AnnouncementModel)
  }

  async findAll(filter: Record<string, unknown> = {}, includeDeleted = false) {
    await connectToDatabase()
    const query = includeDeleted
      ? filter
      : { ...filter, isDeleted: { $ne: true } }
    return this.model.find(query).sort({ createdAt: -1 }).lean()
  }

  async findRecent(limit = 5) {
    await connectToDatabase()
    return AnnouncementModel.find().sort({ createdAt: -1 }).limit(limit).lean()
  }
}

export const announcementsRepository = new AnnouncementsRepository()
