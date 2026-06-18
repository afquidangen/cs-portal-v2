import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IAssessmentScore {
  studentId: string
  score: number
}

export interface IAssessment extends Document {
  id: string
  classId: string
  name: string
  category: string
  gradingPeriod: "midterm" | "final" | "both"
  maxScore: number
  scores: IAssessmentScore[]
  archived: boolean
  createdAt: string
  updatedAt: string
}

const AssessmentScoreSchema = new Schema<IAssessmentScore>(
  {
    studentId: { type: String, required: true },
    score: { type: Number, default: 0 },
  },
  { _id: false }
)

const AssessmentSchema = new Schema<IAssessment>(
  {
    id: { type: String, required: true, unique: true },
    classId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    gradingPeriod: { type: String, enum: ["midterm", "final", "both"], default: "midterm" },
    maxScore: { type: Number, default: 100 },
    scores: { type: [AssessmentScoreSchema], default: [] },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
)

AssessmentSchema.index({ classId: 1, gradingPeriod: 1, category: 1 })

export const AssessmentModel =
  (mongoose.models.Assessment as Model<IAssessment> | undefined) ??
  mongoose.model<IAssessment>("Assessment", AssessmentSchema)
