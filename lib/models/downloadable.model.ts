import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IDownloadable extends Document {
  label: string
  href: string
  fileName?: string
  fileSize?: number
}

const DownloadableSchema = new Schema<IDownloadable>(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    fileName: String,
    fileSize: Number,
  },
  { timestamps: true }
)

export const DownloadableModel =
  (mongoose.models.Downloadable as Model<IDownloadable> | undefined) ??
  mongoose.model<IDownloadable>("Downloadable", DownloadableSchema)
