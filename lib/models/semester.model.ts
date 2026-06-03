import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ISemester extends Document {
  id: string
  name: string
  schoolYear: string
  enrollment: string
  gradeSubmission: string
}

const SemesterSchema = new Schema<ISemester>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    schoolYear: String,
    enrollment: String,
    gradeSubmission: String,
  },
  { timestamps: true }
)

export const SemesterModel =
  (mongoose.models.Semester as Model<ISemester> | undefined) ??
  mongoose.model<ISemester>("Semester", SemesterSchema)
