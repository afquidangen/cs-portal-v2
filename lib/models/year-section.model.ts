import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IYearSection extends Document {
  year: string
  sections: string[]
}

const YearSectionSchema = new Schema<IYearSection>(
  {
    year: { type: String, required: true },
    sections: [{ type: String }],
  },
  { timestamps: true }
)

export const YearSectionModel =
  (mongoose.models.YearSection as Model<IYearSection> | undefined) ??
  mongoose.model<IYearSection>("YearSection", YearSectionSchema)
