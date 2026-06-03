import { SubjectModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class SubjectsRepository extends BaseRepository {
  constructor() {
    super(SubjectModel)
  }
}

export const subjectsRepository = new SubjectsRepository()
