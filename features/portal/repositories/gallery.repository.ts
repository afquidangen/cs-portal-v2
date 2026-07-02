import { GalleryItemModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"
import { BaseRepository } from "./base.repository"

export class GalleryRepository extends BaseRepository {
  constructor() {
    super(GalleryItemModel)
  }

  async findAll(filter: Record<string, unknown> = {}) {
    await connectToDatabase()
    return this.model.find(filter).sort({ createdAt: -1 }).lean()
  }
}

export const galleryRepository = new GalleryRepository()
