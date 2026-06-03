import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ISemester extends Document {
  id: string
  semester: "First Semester" | "Midyear" | "Second Semester"
  schoolYearStart: number
  schoolYearEnd: number
  status: "Active" | "Inactive"
}

if (mongoose.models.Semester) {
  delete mongoose.models.Semester
}

const SemesterSchema = new Schema<ISemester>(
  {
    id: { type: String, required: true, unique: true },
    semester: { type: String, enum: ["First Semester", "Midyear", "Second Semester"], required: true },
    schoolYearStart: { type: Number, required: true },
    schoolYearEnd: { type: Number, required: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
)

export const SemesterModel: Model<ISemester> = mongoose.model<ISemester>("Semester", SemesterSchema)
