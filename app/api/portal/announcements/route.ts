import { announcementsRepository } from "@/features/portal/repositories/announcements.repository"
import { success, error, badRequest } from "@/lib/api-response"
import { connectToDatabase } from "@/lib/mongodb"
import { UserModel } from "@/lib/models"
import { sendAnnouncementEmails } from "@/features/portal/services/email"

export const runtime = "nodejs"

export async function GET() {
  try {
    const announcements = await announcementsRepository.findAll()
    return success(announcements)
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
      try {
        await connectToDatabase()
        const query: Record<string, unknown> = { role: "student", status: "Active" }
        if (body.classSections?.length) {
          query.section = { $in: body.classSections }
        }
        const students = (await UserModel.find(query)
          .lean()
          .select("id email name")) as { id: string; email: string; name: string }[]

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
        console.warn("[Email] Announcement notification error:", emailErr)
      }
    })

    return success(announcement, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create announcement.")
  }
}
