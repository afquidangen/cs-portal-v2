import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IQuickLink extends Document {
  label: string
  href: string
}

const QuickLinkSchema = new Schema<IQuickLink>(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
  },
  { timestamps: true }
)

export const QuickLinkModel =
  (mongoose.models.QuickLink as Model<IQuickLink> | undefined) ??
  mongoose.model<IQuickLink>("QuickLink", QuickLinkSchema)
