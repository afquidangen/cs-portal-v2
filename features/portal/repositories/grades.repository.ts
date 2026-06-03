import { GradeModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class GradesRepository extends BaseRepository {
  constructor() {
    super(GradeModel)
  }

  async findByStudent(studentId: string) {
    return this.findAll({ studentId })
  }

  async findBySection(section: string) {
    return this.findAll({ section })
  }
}

export const gradesRepository = new GradesRepository()
