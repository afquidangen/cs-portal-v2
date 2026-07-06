import { NextRequest } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { MaintenanceSettingModel } from "@/lib/models"
import { requireAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth

  try {
    const body = (await request.json()) as {
      maintenanceMode?: boolean
      maintenanceTitle?: string
      maintenanceDescription?: string
      maintenanceNoticeTitle?: string
      maintenanceNoticeMessage?: string
    }

    if (typeof body.maintenanceMode !== "boolean") {
      return Response.json({ error: "maintenanceMode (boolean) is required" }, { status: 400 })
    }

    await connectToDatabase()

    const update: Record<string, unknown> = {
      maintenanceMode: body.maintenanceMode,
      updatedBy: auth.user.email,
      updatedAt: new Date(),
    }

    if (body.maintenanceTitle !== undefined) update.maintenanceTitle = body.maintenanceTitle
    if (body.maintenanceDescription !== undefined) update.maintenanceDescription = body.maintenanceDescription
    if (body.maintenanceNoticeTitle !== undefined) update.maintenanceNoticeTitle = body.maintenanceNoticeTitle
    if (body.maintenanceNoticeMessage !== undefined) update.maintenanceNoticeMessage = body.maintenanceNoticeMessage

    const setting = await MaintenanceSettingModel.findOneAndUpdate({}, update, {
      upsert: true,
      new: true,
    })

    return Response.json({
      maintenanceMode: setting.maintenanceMode,
      maintenanceTitle: setting.maintenanceTitle,
      maintenanceDescription: setting.maintenanceDescription,
      maintenanceNoticeTitle: setting.maintenanceNoticeTitle,
      maintenanceNoticeMessage: setting.maintenanceNoticeMessage,
      updatedBy: setting.updatedBy,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update maintenance setting" },
      { status: 500 }
    )
  }
}
