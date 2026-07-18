import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IImportTemplateFile extends Document {
  id: string
  subjectType: "Lecture" | "Lecture with Lab"
  fileUrl: string
  filePublicId: string
  fileName: string
  uploadedBy: string
  uploadedAt: string
  createdAt: string
  updatedAt: string
}

const ImportTemplateFileSchema = new Schema<IImportTemplateFile>(
  {
    id: { type: String, required: true, unique: true },
    subjectType: {
      type: String,
      enum: ["Lecture", "Lecture with Lab"],
      required: true,
      unique: true,
    },
    fileUrl: { type: String, required: true },
    filePublicId: { type: String, required: true },
    fileName: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: String, required: true },
  },
  { timestamps: true }
)

export const ImportTemplateFileModel =
  (mongoose.models.ImportTemplateFile as Model<IImportTemplateFile> | undefined) ??
  mongoose.model<IImportTemplateFile>("ImportTemplateFile", ImportTemplateFileSchema)
