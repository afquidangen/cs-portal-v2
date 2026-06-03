import { announcementsRepository } from "@/features/portal/repositories/announcements.repository"
import { success, error, badRequest } from "@/lib/api-response"

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
    const announcement = await announcementsRepository.create(body)
    return success(announcement, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create announcement.")
  }
}
