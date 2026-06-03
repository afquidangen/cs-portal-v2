import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ISubject extends Document {
  code: string
  title: string
  units: number
  instructor: string
}

const SubjectSchema = new Schema<ISubject>(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    units: { type: Number, default: 3 },
    instructor: String,
  },
  { timestamps: true }
)

export const SubjectModel =
  (mongoose.models.Subject as Model<ISubject> | undefined) ??
  mongoose.model<ISubject>("Subject", SubjectSchema)
