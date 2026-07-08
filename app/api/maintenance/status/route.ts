import { connectToDatabase } from "@/lib/mongodb"
import { MaintenanceSettingModel } from "@/lib/models"

export const runtime = "nodejs"

const CACHE_CONTROL = { "Cache-Control": "no-cache, no-store, must-revalidate" }

const DEFAULTS = {
  maintenanceMode: false,
  logoText: "ComScite",
  maintenanceHeading: "The site is currently\ndown for maintenance",
  maintenanceSubheading: "",
  maintenanceDescription: "We apologize for any inconvenience caused.\nWe've almost done.",
  maintenanceCardTitle: "Thank you for your patience!",
  maintenanceCardBody:
    "Our team is working hard to improve your experience.\nWe appreciate your understanding.",
  estimatedCompletionTime: "",
  contactEmail: "",
}

export async function GET() {
  try {
    await connectToDatabase()
    const setting = await MaintenanceSettingModel.findOne()
    return Response.json(
      {
        maintenanceMode: setting?.maintenanceMode ?? DEFAULTS.maintenanceMode,
        logoText: setting?.logoText ?? DEFAULTS.logoText,
        maintenanceHeading: setting?.maintenanceHeading ?? DEFAULTS.maintenanceHeading,
        maintenanceSubheading: setting?.maintenanceSubheading ?? DEFAULTS.maintenanceSubheading,
        maintenanceDescription: setting?.maintenanceDescription ?? DEFAULTS.maintenanceDescription,
        maintenanceCardTitle: setting?.maintenanceCardTitle ?? DEFAULTS.maintenanceCardTitle,
        maintenanceCardBody: setting?.maintenanceCardBody ?? DEFAULTS.maintenanceCardBody,
        estimatedCompletionTime: setting?.estimatedCompletionTime ?? DEFAULTS.estimatedCompletionTime,
        contactEmail: setting?.contactEmail ?? DEFAULTS.contactEmail,
      },
      { headers: CACHE_CONTROL }
    )
  } catch {
    return Response.json(
      { ...DEFAULTS, maintenanceMode: true },
      { headers: CACHE_CONTROL }
    )
  }
}
