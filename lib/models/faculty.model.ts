import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IFaculty extends Document {
  id: string
  name: string
  position: string
  role: string
  email: string
  education: string
  status: string
  notes: string
  schedule: string[]
  statusUpdatedAt?: string
}

const FacultySchema = new Schema<IFaculty>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    position: String,
    role: String,
    email: { type: String, required: true },
    education: String,
    status: {
      type: String,
      enum: ["Available", "In Class", "Consultation Only", "Out of Office"],
      default: "Available",
    },
    notes: { type: String, default: "" },
    schedule: [{ type: String }],
    statusUpdatedAt: { type: String },
  },
  { timestamps: true }
)

export const FacultyModel =
  (mongoose.models.Faculty as Model<IFaculty> | undefined) ??
  mongoose.model<IFaculty>("Faculty", FacultySchema)
