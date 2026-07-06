import { connectToDatabase } from "@/lib/mongodb"
import { MaintenanceSettingModel } from "@/lib/models"

export const runtime = "nodejs"

export async function GET() {
  try {
    await connectToDatabase()
    const setting = await MaintenanceSettingModel.findOne()
    return Response.json({
      maintenanceMode: setting?.maintenanceMode ?? false,
      maintenanceTitle:
        setting?.maintenanceTitle ?? "We're currently performing scheduled maintenance.",
      maintenanceDescription:
        setting?.maintenanceDescription ??
        "We're currently performing scheduled maintenance to improve your experience. Please check back again later.",
      maintenanceNoticeTitle: setting?.maintenanceNoticeTitle ?? "Thank you for your patience!",
      maintenanceNoticeMessage:
        setting?.maintenanceNoticeMessage ??
        "Our team is working to restore the service as quickly as possible. We appreciate your understanding.",
    })
  } catch {
    return Response.json({
      maintenanceMode: false,
      maintenanceTitle: "We're currently performing scheduled maintenance.",
      maintenanceDescription:
        "We're currently performing scheduled maintenance to improve your experience. Please check back again later.",
      maintenanceNoticeTitle: "Thank you for your patience!",
      maintenanceNoticeMessage:
        "Our team is working to restore the service as quickly as possible. We appreciate your understanding.",
    })
  }
}
