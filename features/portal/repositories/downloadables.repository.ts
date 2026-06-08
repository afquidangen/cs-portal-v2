import { DownloadableModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class DownloadablesRepository extends BaseRepository {
  constructor() {
    super(DownloadableModel)
  }
}

export const downloadablesRepository = new DownloadablesRepository()
