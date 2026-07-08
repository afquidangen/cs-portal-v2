import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IOtp extends Document {
  email: string
  code: string
  expiresAt: Date
  used: boolean
}

const OtpSchema = new Schema<IOtp>({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
})

OtpSchema.index({ email: 1, expiresAt: -1 })
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const OtpModel: Model<IOtp> =
  (mongoose.models.Otp as Model<IOtp> | undefined) ??
  mongoose.model<IOtp>("Otp", OtpSchema)
