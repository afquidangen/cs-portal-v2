import { AboutModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class AboutRepository extends BaseRepository {
  constructor() {
    super(AboutModel)
  }
}

export const aboutRepository = new AboutRepository()
