import { announcementsRepository } from "@/features/portal/repositories/announcements.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { requireAuth } from "@/lib/api-auth"
import { connectToDatabase } from "@/lib/mongodb"
import { UserModel, PushSubscriptionModel } from "@/lib/models"
import { sendPushToSubscriptions } from "@/lib/web-push"
import { sendAnnouncementEmails } from "@/features/portal/services/email"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof Response) return auth
    const { user } = auth

    const announcements = await announcementsRepository.findAll()
    const section = user.section ?? ""
    const filtered = announcements.filter((a: Record<string, unknown>) => {
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
    })

    return success(filtered)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch announcements.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.title) {
      return badRequest("Announcement id and title are required.")
    }
    const announcement = (await announcementsRepository.create(
      body,
    )) as Record<string, unknown>

    Promise.resolve().then(async () => {
      let students: Array<{
        id: string
        email: string
        name: string
        pushNotificationsEnabled?: boolean
      }> = []

      try {
        await connectToDatabase()
        const query: Record<string, unknown> = { role: "student", status: "Active" }
        if (body.classSections?.length) {
          query.section = { $in: body.classSections }
        }
        students = (await UserModel.find(query)
          .lean()
          .select("id email name pushNotificationsEnabled")) as typeof students

        const validStudents = students.filter((s) => s.email?.includes("@"))

        await sendAnnouncementEmails(
          validStudents,
          {
            id: announcement.id as string,
            title: announcement.title as string,
            content: announcement.content as string,
            date: announcement.date as string,
            createdBy: announcement.createdBy as string | undefined,
          },
        )
      } catch (emailErr) {
        console.warn("[Notification] Announcement email error:", emailErr)
      }

      // Send push notifications — separate try/catch from email
      try {
        const pushTargetIds = students
          .filter((s) => s.pushNotificationsEnabled !== false)
          .map((s) => s.id)

        if (pushTargetIds.length > 0) {
          const subscriptions = await PushSubscriptionModel.find({
            userId: { $in: pushTargetIds },
          }).lean()

          if (subscriptions.length > 0) {
            const content = (announcement.content as string) || ""
            const body = content.length > 120 ? content.slice(0, 120) + "..." : content

            await sendPushToSubscriptions(
              subscriptions as Array<{
                id: string
                userId: string
                endpoint: string
                p256dhKey: string
                authKey: string
              }>,
              {
                title: "Student Portal",
                body,
                icon: "/portal-logo.svg",
                url: "/student",
              },
            )
          }
        }
      } catch (pushErr) {
        console.warn("[Notification] Announcement push error:", pushErr)
      }
    })

    return success(announcement, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create announcement.")
  }
}
