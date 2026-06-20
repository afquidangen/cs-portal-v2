import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IThesis extends Document {
  id: string
  title: string
  authors: string
  year: number
  category: string
  adviser: string
  abstract: string
  tags: string[]
  pdfUrl: string
  fileName: string
  cloudinaryPublicId?: string
  isDeleted?: boolean
  deletedAt?: Date | null
  deletedBy?: string
}

const ThesisSchema = new Schema<IThesis>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    authors: String,
    year: Number,
    category: String,
    adviser: String,
    abstract: String,
    tags: [String],
    pdfUrl: String,
    fileName: String,
    cloudinaryPublicId: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: String,
  },
  { timestamps: true }
)

export const ThesisModel =
  (mongoose.models.Thesis as Model<IThesis> | undefined) ??
  mongoose.model<IThesis>("Thesis", ThesisSchema)
