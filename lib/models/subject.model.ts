import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ISubject extends Document {
  id: string
  curriculumId: string
  yearLevel: string
  semester: string
  code: string
  name: string
  type: "Lecture" | "Lecture with Lab"
  lectureUnits: number
  labUnits: number
  totalUnits: number
}

if (mongoose.models.Subject) {
  delete mongoose.models.Subject
}

const SubjectSchema = new Schema<ISubject>(
  {
    id: { type: String, required: true, unique: true },
    curriculumId: { type: String, required: true },
    yearLevel: { type: String, required: true },
    semester: { type: String, required: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["Lecture", "Lecture with Lab"], required: true },
    lectureUnits: { type: Number, default: 3 },
    labUnits: { type: Number, default: 0 },
    totalUnits: { type: Number, default: 3 },
  },
  { timestamps: true }
)

export const SubjectModel: Model<ISubject> = mongoose.model<ISubject>("Subject", SubjectSchema)
