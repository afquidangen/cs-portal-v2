import { CsoInfoModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class CsoInfoRepository extends BaseRepository {
  constructor() {
    super(CsoInfoModel)
  }
}

export const csoInfoRepository = new CsoInfoRepository()
