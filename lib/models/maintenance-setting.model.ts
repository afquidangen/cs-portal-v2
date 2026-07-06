import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IMaintenanceSetting extends Document {
  maintenanceMode: boolean
  message: string
  updatedBy: string
  updatedAt: Date
}

if (mongoose.models.MaintenanceSetting) {
  delete mongoose.models.MaintenanceSetting
}

const MaintenanceSettingSchema = new Schema<IMaintenanceSetting>(
  {
    maintenanceMode: { type: Boolean, default: false },
    message: { type: String, default: "System is currently under maintenance. Please check back later." },
    updatedBy: { type: String },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const MaintenanceSettingModel: Model<IMaintenanceSetting> =
  mongoose.model<IMaintenanceSetting>("MaintenanceSetting", MaintenanceSettingSchema)
