import { GalleryItemModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class GalleryRepository extends BaseRepository {
  constructor() {
    super(GalleryItemModel)
  }
}

export const galleryRepository = new GalleryRepository()
