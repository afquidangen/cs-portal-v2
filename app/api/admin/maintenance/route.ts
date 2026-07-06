import { NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { MaintenanceSettingModel } from "@/lib/models"
import { requireAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

const STRING_FIELDS = [
  "logoText",
  "maintenanceHeading",
  "maintenanceSubheading",
  "maintenanceDescription",
  "maintenanceCardTitle",
  "maintenanceCardBody",
  "estimatedCompletionTime",
  "contactEmail",
] as const

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const body = (await request.json()) as Record<string, unknown>

    if (typeof body.maintenanceMode !== "boolean") {
      return Response.json({ error: "maintenanceMode (boolean) is required" }, { status: 400 })
    }

    await connectToDatabase()

    const update: Record<string, unknown> = {
      maintenanceMode: body.maintenanceMode,
      updatedBy: auth.user.email,
      updatedAt: new Date(),
    }

    for (const field of STRING_FIELDS) {
      if (body[field] !== undefined) {
        update[field] = body[field]
      }
    }

    const setting = await MaintenanceSettingModel.findOneAndUpdate({}, update, {
      upsert: true,
      new: true,
    })

    return Response.json({
      maintenanceMode: setting.maintenanceMode,
      logoText: setting.logoText,
      maintenanceHeading: setting.maintenanceHeading,
      maintenanceSubheading: setting.maintenanceSubheading,
      maintenanceDescription: setting.maintenanceDescription,
      maintenanceCardTitle: setting.maintenanceCardTitle,
      maintenanceCardBody: setting.maintenanceCardBody,
      estimatedCompletionTime: setting.estimatedCompletionTime,
      contactEmail: setting.contactEmail,
      updatedBy: setting.updatedBy,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update maintenance setting" },
      { status: 500 }
    )
  }
}
