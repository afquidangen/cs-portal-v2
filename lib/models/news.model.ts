import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface INews extends Document {
  id: number
  category: string
  headline: string
  summary: string
  content: string
  accent: string
}

const NewsSchema = new Schema<INews>(
  {
    id: { type: Number, required: true, unique: true },
    category: String,
    headline: { type: String, required: true },
    summary: String,
    content: String,
    accent: String,
  },
  { timestamps: true }
)

export const NewsModel =
  (mongoose.models.News as Model<INews> | undefined) ??
  mongoose.model<INews>("News", NewsSchema)
