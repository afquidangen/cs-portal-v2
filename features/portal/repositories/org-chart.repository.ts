import { OrgChartModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class OrgChartRepository extends BaseRepository {
  constructor() {
    super(OrgChartModel)
  }
}

export const orgChartRepository = new OrgChartRepository()
