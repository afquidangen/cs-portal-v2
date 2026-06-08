import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IGoverningDocument extends Document {
  href: string
  fileName?: string
  fileSize?: number
}

const GoverningDocumentSchema = new Schema<IGoverningDocument>(
  {
    href: { type: String, required: true },
    fileName: String,
    fileSize: Number,
  },
  { timestamps: true }
)

export const GoverningDocumentModel =
  (mongoose.models.GoverningDocument as Model<IGoverningDocument> | undefined) ??
  mongoose.model<IGoverningDocument>("GoverningDocument", GoverningDocumentSchema)
