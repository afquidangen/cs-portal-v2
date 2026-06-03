import { SeminarModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class SeminarsRepository extends BaseRepository {
  constructor() {
    super(SeminarModel)
  }

  async findActive() {
    return this.findAll({ status: "Active" })
  }
}

export const seminarsRepository = new SeminarsRepository()
