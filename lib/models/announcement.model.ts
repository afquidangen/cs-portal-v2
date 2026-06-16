import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IAnnouncement extends Document {
  id: string
  title: string
  content: string
  date: string
  audience: string
  priority: "High" | "Medium" | "Low"
  classSection?: string
  classSections?: string[]
  createdBy?: string
  readBy?: string[]
  isDeleted?: boolean
  deletedAt?: Date | null
  deletedBy?: string
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    content: String,
    date: String,
    audience: String,
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    classSection: String,
    classSections: [String],
    createdBy: String,
    readBy: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: String,
  },
  { timestamps: true }
)

export const AnnouncementModel =
  (mongoose.models.Announcement as Model<IAnnouncement> | undefined) ??
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema)
