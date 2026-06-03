import { FeedbackModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class FeedbackRepository extends BaseRepository {
  constructor() {
    super(FeedbackModel)
  }

  async findByStatus(status: string) {
    return this.findAll({ status })
  }
}

export const feedbackRepository = new FeedbackRepository()
