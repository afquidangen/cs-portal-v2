import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ISeminar extends Document {
  id: string
  title: string
  speaker: string
  date: string
  location: string
  description: string
  capacity: number
  enlistedStudentIds: string[]
  host: string
  status: "Active" | "Closed"
}

const SeminarSchema = new Schema<ISeminar>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    speaker: String,
    date: String,
    location: String,
    description: String,
    capacity: { type: Number, default: 0 },
    enlistedStudentIds: [{ type: String }],
    host: String,
    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
  },
  { timestamps: true }
)

export const SeminarModel =
  (mongoose.models.Seminar as Model<ISeminar> | undefined) ??
  mongoose.model<ISeminar>("Seminar", SeminarSchema)
