import { YearSectionModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class YearSectionsRepository extends BaseRepository {
  constructor() {
    super(YearSectionModel)
  }
}

export const yearSectionsRepository = new YearSectionsRepository()
