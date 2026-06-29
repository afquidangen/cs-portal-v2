import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IPushSubscription extends Document {
  id: string
  userId: string
  endpoint: string
  p256dhKey: string
  authKey: string
  createdAt: Date
  updatedAt: Date
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    p256dhKey: { type: String, required: true },
    authKey: { type: String, required: true },
  },
  { timestamps: true }
)

PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true })

export const PushSubscriptionModel: Model<IPushSubscription> =
  (mongoose.models.PushSubscription as Model<IPushSubscription> | undefined) ??
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema)
