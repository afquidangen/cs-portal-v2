import { connectToDatabase } from "@/lib/mongodb"
import { AnnouncementModel } from "@/lib/models"
import { success, error } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    await connectToDatabase()
    const trashed = await AnnouncementModel.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean()
    return success(trashed)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch trashed announcements.")
  }
}
