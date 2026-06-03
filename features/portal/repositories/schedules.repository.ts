import { ScheduleModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class SchedulesRepository extends BaseRepository {
  constructor() {
    super(ScheduleModel)
  }

  async findBySection(section: string) {
    return this.findAll({ section })
  }

  async findByInstructor(instructor: string) {
    return this.findAll({ instructor })
  }
}

export const schedulesRepository = new SchedulesRepository()
