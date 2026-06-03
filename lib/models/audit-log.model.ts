import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IAuditLog extends Document {
  id: string
  actor: string
  action: string
  time: string
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    id: { type: String, required: true, unique: true },
    actor: { type: String, required: true },
    action: String,
    time: String,
  },
  { timestamps: true }
)

export const AuditLogModel =
  (mongoose.models.AuditLog as Model<IAuditLog> | undefined) ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)
