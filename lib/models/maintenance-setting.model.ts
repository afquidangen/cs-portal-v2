import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IMaintenanceSetting extends Document {
  maintenanceMode: boolean
  maintenanceTitle: string
  maintenanceDescription: string
  maintenanceNoticeTitle: string
  maintenanceNoticeMessage: string
  updatedBy: string
  updatedAt: Date
}

if (mongoose.models.MaintenanceSetting) {
  delete mongoose.models.MaintenanceSetting
}

const MaintenanceSettingSchema = new Schema<IMaintenanceSetting>(
  {
    maintenanceMode: { type: Boolean, default: false },
    maintenanceTitle: {
      type: String,
      default: "We're currently performing scheduled maintenance.",
    },
    maintenanceDescription: {
      type: String,
      default:
        "We're currently performing scheduled maintenance to improve your experience. Please check back again later.",
    },
    maintenanceNoticeTitle: {
      type: String,
      default: "Thank you for your patience!",
    },
    maintenanceNoticeMessage: {
      type: String,
      default:
        "Our team is working to restore the service as quickly as possible. We appreciate your understanding.",
    },
    updatedBy: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const MaintenanceSettingModel: Model<IMaintenanceSetting> =
  mongoose.model<IMaintenanceSetting>("MaintenanceSetting", MaintenanceSettingSchema)
