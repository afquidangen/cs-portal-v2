import mongoose, { Schema, type Document, type Model } from "mongoose"

import type { PortalCollectionName } from "../types/collections"

export interface IPortalCollectionDocument extends Document {
  name: PortalCollectionName
  items: unknown[]
}

const PortalCollectionSchema = new Schema<IPortalCollectionDocument>(
  {
    name: { type: String, required: true, unique: true },
    items: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
)

export const PortalCollectionModel =
  (mongoose.models.PortalCollection as Model<IPortalCollectionDocument> | undefined) ??
  mongoose.model<IPortalCollectionDocument>(
    "PortalCollection",
    PortalCollectionSchema
  )
