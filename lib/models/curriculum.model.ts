import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ICurriculum extends Document {
  id: string
  name: string
  major: string
  status: "Active" | "Archived"
  totalUnits: number
  terms: {
    year: string
    semester: string
    subjects: {
      code: string
      name: string
      lec: number
      lab: number
      total: number
    }[]
  }[]
}

const CurriculumSchema = new Schema<ICurriculum>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    major: String,
    status: {
      type: String,
      enum: ["Active", "Archived"],
      default: "Active",
    },
    totalUnits: { type: Number, default: 0 },
    terms: [
      {
        year: String,
        semester: String,
        subjects: [
          {
            code: String,
            name: String,
            lec: Number,
            lab: Number,
            total: Number,
          },
        ],
      },
    ],
  },
  { timestamps: true }
)

export const CurriculumModel =
  (mongoose.models.Curriculum as Model<ICurriculum> | undefined) ??
  mongoose.model<ICurriculum>("Curriculum", CurriculumSchema)
