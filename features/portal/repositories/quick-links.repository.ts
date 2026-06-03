import { QuickLinkModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class QuickLinksRepository extends BaseRepository {
  constructor() {
    super(QuickLinkModel)
  }
}

export const quickLinksRepository = new QuickLinksRepository()
