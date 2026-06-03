import { FacultyModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class FacultyRepository extends BaseRepository {
  constructor() {
    super(FacultyModel)
  }

  async findByStatus(status: string) {
    return this.findAll({ status })
  }
}

export const facultyRepository = new FacultyRepository()
