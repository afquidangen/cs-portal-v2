import mongoose, { Schema, type Document } from "mongoose"

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
  },
  { timestamps: true }
)

export default mongoose.model<IThesis>("Thesis", ThesisSchema)
