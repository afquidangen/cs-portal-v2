import { CurriculumModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class CurriculaRepository extends BaseRepository {
  constructor() {
    super(CurriculumModel)
  }

  async findActive() {
    return this.findAll({ status: "Active" })
  }
}

export const curriculaRepository = new CurriculaRepository()
