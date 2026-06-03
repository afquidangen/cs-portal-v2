import { SemesterModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class SemestersRepository extends BaseRepository {
  constructor() {
    super(SemesterModel)
  }
}

export const semestersRepository = new SemestersRepository()
