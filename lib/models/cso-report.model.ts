import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ICsoReport extends Document {
  id: string
  title: string
  type: "Event" | "Accomplishment" | "Financial" | "Record"
  date: string
  summary: string
  total?: string
  image?: string
}

const CsoReportSchema = new Schema<ICsoReport>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["Event", "Accomplishment", "Financial", "Record"],
      required: true,
    },
    date: String,
    summary: String,
    total: String,
    image: String,
  },
  { timestamps: true }
)

export const CsoReportModel =
  (mongoose.models.CsoReport as Model<ICsoReport> | undefined) ??
  mongoose.model<ICsoReport>("CsoReport", CsoReportSchema)
