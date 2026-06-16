import { AssessmentModel } from "@/lib/models"
import { BaseRepository } from "./base.repository"

export class AssessmentRepository extends BaseRepository {
  constructor() {
    super(AssessmentModel)
  }

  async findByClass(classId: string) {
    return this.findAll({ classId, archived: false })
  }

  async findByClassAndCategory(classId: string, category: string) {
    return this.findAll({ classId, category, archived: false })
  }

  async upsertScore(assessmentId: string, studentId: string, score: number) {
    const assessment = await this.findById(assessmentId) as { scores?: Array<{ studentId: string; score: number }> } | null
    if (!assessment) return null

    const scores = assessment.scores || []
    const existingIndex = scores.findIndex(
      (s: { studentId: string }) => s.studentId === studentId
    )

    if (existingIndex >= 0) {
      scores[existingIndex].score = score
    } else {
      scores.push({ studentId, score })
    }

    return this.update({ id: assessmentId }, { scores })
  }
}

export const assessmentRepository = new AssessmentRepository()
