import { connectToDatabase } from "@/lib/mongodb"
import { AnnouncementModel } from "@/lib/models"
import { success, error } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    await connectToDatabase()
    const url = new URL(request.url)
    const deletedBy = url.searchParams.get("deletedBy")
    const filter: Record<string, unknown> = { isDeleted: true }
    if (deletedBy) filter.deletedBy = deletedBy
    const trashed = await AnnouncementModel.find(filter).sort({ deletedAt: -1 }).lean()
    return success(trashed)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch trashed announcements.")
  }
}
