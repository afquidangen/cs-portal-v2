import {
  getPortalDashboardData,
  replacePortalDashboardData,
} from "@/features/portal/repositories/portal-dashboard.repository"

export const runtime = "nodejs"

export async function GET() {
  try {
    const data = await getPortalDashboardData()
    return Response.json({ data })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load dashboard data.",
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json()
    const data = await replacePortalDashboardData(payload.data)
    return Response.json({ data })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save dashboard data.",
      },
      { status: 500 }
    )
  }
}
