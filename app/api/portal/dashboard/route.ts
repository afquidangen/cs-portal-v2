import {
  getPortalDashboardData,
  replacePortalDashboardData,
} from "@/features/portal/repositories/portal-dashboard.repository"
import { requireAuth } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const { user } = auth

    const data = await getPortalDashboardData()

    const section = user.section ?? ""
    data.announcements = data.announcements.filter((a) => {
      if (user.role === "admin") return a.audience === "All Users"
      if (user.role === "student") {
        return a.audience === "All Users"
          || a.audience === "Students"
          || a.audience?.toString().split(", ").includes(section)
          || (a.classSections as string[])?.includes(section)
          || a.classSection === section
      }
      return a.audience === "All Users"
        || a.audience === "Faculty"
        || a.createdBy === user.name
    }) as unknown as typeof data.announcements

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
