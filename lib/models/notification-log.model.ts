import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface INotificationLog extends Document {
  id: string
  type: "grade_released" | "announcement"
  studentId?: string
  email: string
  announcementId?: string
  status: "sent" | "failed"
  timestamp: Date
  errorMessage?: string
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    id: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["grade_released", "announcement"],
      required: true,
    },
    studentId: String,
    email: { type: String, required: true },
    announcementId: String,
    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    errorMessage: String,
  },
  { timestamps: true }
)

NotificationLogSchema.index({ type: 1, timestamp: -1 })
NotificationLogSchema.index({ studentId: 1 })
NotificationLogSchema.index({ announcementId: 1 })

export const NotificationLogModel: Model<INotificationLog> =
  (mongoose.models.NotificationLog as Model<INotificationLog> | undefined) ??
  mongoose.model<INotificationLog>("NotificationLog", NotificationLogSchema)
