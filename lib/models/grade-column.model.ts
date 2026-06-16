import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IGradeColumn extends Document {
  id: string
  classId: string
  name: string
  category: string
  maxScore: number
  order: number
  width?: number
  displayName?: string
  createdAt: string
  updatedAt: string
}

const GradeColumnSchema = new Schema<IGradeColumn>(
  {
    id: { type: String, required: true, unique: true },
    classId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    maxScore: { type: Number, default: 100 },
    order: { type: Number, default: 0 },
    width: { type: Number },
    displayName: { type: String },
  },
  { timestamps: true }
)

GradeColumnSchema.index({ classId: 1, order: 1 })

export const GradeColumnModel =
  (mongoose.models.GradeColumn as Model<IGradeColumn> | undefined) ??
  mongoose.model<IGradeColumn>("GradeColumn", GradeColumnSchema)
