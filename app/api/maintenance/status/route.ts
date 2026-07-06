import { connectToDatabase } from "@/lib/mongodb"
import { MaintenanceSettingModel } from "@/lib/models"

export const runtime = "nodejs"

export async function GET() {
  try {
    await connectToDatabase()
    const setting = await MaintenanceSettingModel.findOne()
    return Response.json({
      maintenanceMode: setting?.maintenanceMode ?? false,
      message: setting?.message ?? "System is currently under maintenance. Please check back later.",
    })
  } catch {
    return Response.json({ maintenanceMode: false, message: "" })
  }
}
