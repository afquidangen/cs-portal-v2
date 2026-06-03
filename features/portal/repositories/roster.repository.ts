import { ClassStudentModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class RosterRepository extends BaseRepository {
  constructor() {
    super(ClassStudentModel)
  }

  async findBySection(section: string) {
    return this.findAll({ section })
  }

  async findEnrolled() {
    return this.findAll({ enrolled: true })
  }
}

export const rosterRepository = new RosterRepository()
