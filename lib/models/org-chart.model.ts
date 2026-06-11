import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IOrgChart extends Document {
  imageUrl: string
  cloudinaryPublicId?: string
}

const OrgChartSchema = new Schema<IOrgChart>(
  {
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: String,
  },
  { timestamps: true }
)

export const OrgChartModel =
  (mongoose.models.OrgChart as Model<IOrgChart> | undefined) ??
  mongoose.model<IOrgChart>("OrgChart", OrgChartSchema)
