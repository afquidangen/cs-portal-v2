import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IMaintenanceSetting extends Document {
  maintenanceMode: boolean
  logoText: string
  maintenanceHeading: string
  maintenanceSubheading: string
  maintenanceDescription: string
  maintenanceCardTitle: string
  maintenanceCardBody: string
  estimatedCompletionTime: string
  contactEmail: string
  updatedBy: string
  updatedAt: Date
}

if (mongoose.models.MaintenanceSetting) {
  delete mongoose.models.MaintenanceSetting
}

const MaintenanceSettingSchema = new Schema<IMaintenanceSetting>(
  {
    maintenanceMode: { type: Boolean, default: false },
    logoText: { type: String, default: "ComScite" },
    maintenanceHeading: {
      type: String,
      default: "The site is currently\ndown for maintenance",
    },
    maintenanceSubheading: { type: String, default: "" },
    maintenanceDescription: {
      type: String,
      default: "We apologize for any inconvenience caused.\nWe've almost done.",
    },
    maintenanceCardTitle: {
      type: String,
      default: "Thank you for your patience!",
    },
    maintenanceCardBody: {
      type: String,
      default:
        "Our team is working hard to improve your experience.\nWe appreciate your understanding.",
    },
    estimatedCompletionTime: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    updatedBy: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const MaintenanceSettingModel: Model<IMaintenanceSetting> =
  mongoose.model<IMaintenanceSetting>("MaintenanceSetting", MaintenanceSettingSchema)
