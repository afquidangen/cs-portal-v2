import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IGalleryItem extends Document {
  id: string
  title: string
  description: string
  image: string
  cloudinaryPublicId?: string
}

const GalleryItemSchema = new Schema<IGalleryItem>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, required: true },
    cloudinaryPublicId: String,
  },
  { timestamps: true }
)

export const GalleryItemModel =
  (mongoose.models.GalleryItem as Model<IGalleryItem> | undefined) ??
  mongoose.model<IGalleryItem>("GalleryItem", GalleryItemSchema)
