import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IGradingTemplateColumn {
  name: string
  category: string
  maxScore: number
  order: number
}

export interface IGradingTemplate extends Document {
  id: string
  name: string
  classId: string
  subjectType: "Lecture" | "Lecture with Lab"
  columns: IGradingTemplateColumn[]
  createdAt: string
  updatedAt: string
}

const GradingTemplateColumnSchema = new Schema<IGradingTemplateColumn>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    maxScore: { type: Number, default: 100 },
    order: { type: Number, default: 0 },
  },
  { _id: false }
)

const GradingTemplateSchema = new Schema<IGradingTemplate>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    classId: { type: String, required: true, index: true },
    subjectType: {
      type: String,
      enum: ["Lecture", "Lecture with Lab"],
      default: "Lecture",
    },
    columns: { type: [GradingTemplateColumnSchema], default: [] },
  },
  { timestamps: true }
)

GradingTemplateSchema.index({ classId: 1, name: 1 })

export const GradingTemplateModel =
  (mongoose.models.GradingTemplate as Model<IGradingTemplate> | undefined) ??
  mongoose.model<IGradingTemplate>("GradingTemplate", GradingTemplateSchema)
