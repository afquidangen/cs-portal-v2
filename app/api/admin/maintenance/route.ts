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
      message?: string
    }

    if (typeof body.maintenanceMode !== "boolean") {
      return Response.json({ error: "maintenanceMode (boolean) is required" }, { status: 400 })
    }

    await connectToDatabase()

    const setting = await MaintenanceSettingModel.findOneAndUpdate(
      {},
      {
        maintenanceMode: body.maintenanceMode,
        message: body.message ?? "System is currently under maintenance. Please check back later.",
        updatedBy: auth.user.email,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    )

    return Response.json({
      maintenanceMode: setting.maintenanceMode,
      message: setting.message,
      updatedBy: setting.updatedBy,
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to update maintenance setting" },
      { status: 500 }
    )
  }
}
