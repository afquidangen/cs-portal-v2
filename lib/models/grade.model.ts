import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IGrade extends Document {
  id: string
  studentId: string
  student: string
  section: string
  subject: string
  code: string
  units: number
  midtermTransmuted?: number
  midterm: number
  finalTransmuted?: number
  finalTerm: number
  gradePercentage?: number
  remarks?: string
  released?: boolean
  updatedAt: string
  deletedAt?: string | null
}

const GradeSchema = new Schema<IGrade>(
  {
    id: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    student: String,
    section: String,
    subject: String,
    code: String,
    units: { type: Number, default: 3 },
    midtermTransmuted: Number,
    midterm: { type: Number, default: 5 },
    finalTransmuted: Number,
    finalTerm: { type: Number, default: 5 },
    gradePercentage: Number,
    remarks: String,
    released: { type: Boolean, default: false },
    updatedAt: String,
    deletedAt: { type: String, default: null },
  },
  { timestamps: true }
)

export const GradeModel =
  (mongoose.models.Grade as Model<IGrade> | undefined) ??
  mongoose.model<IGrade>("Grade", GradeSchema)
