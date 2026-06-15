import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ICsoInfo extends Document {
  orgName: string
  description: string
  logoUrl: string
  logoPublicId?: string
  facebookLink: string
  portalLogoUrl: string
  portalLogoPublicId?: string
}

const CsoInfoSchema = new Schema<ICsoInfo>(
  {
    orgName: { type: String, default: "COMPUTING STUDIES STUDENTS ORGANIZATION" },
    description: { type: String, default: "" },
    logoUrl: { type: String, default: "/csso-logo.svg" },
    logoPublicId: String,
    facebookLink: { type: String, default: "https://www.facebook.com/profile.php?id=61587590024541" },
    portalLogoUrl: { type: String, default: "/portal-logo.svg" },
    portalLogoPublicId: String,
  },
  { timestamps: true }
)

export const CsoInfoModel =
  (mongoose.models.CsoInfo as Model<ICsoInfo> | undefined) ??
  mongoose.model<ICsoInfo>("CsoInfo", CsoInfoSchema)
