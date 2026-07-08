import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IResetToken extends Document {
  email: string
  token: string
  expiresAt: Date
  used: boolean
}

const ResetTokenSchema = new Schema<IResetToken>({
  email: { type: String, required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
})

ResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const ResetTokenModel: Model<IResetToken> =
  (mongoose.models.ResetToken as Model<IResetToken> | undefined) ??
  mongoose.model<IResetToken>("ResetToken", ResetTokenSchema)
