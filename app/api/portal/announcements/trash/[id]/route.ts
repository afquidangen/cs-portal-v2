import { connectToDatabase } from "@/lib/mongodb"
import { AnnouncementModel } from "@/lib/models"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectToDatabase()
    const result = await AnnouncementModel.collection.updateOne(
      { id },
      { $set: { isDeleted: false, deletedAt: null, deletedBy: null } }
    )
    if (result.matchedCount === 0) return notFound("Announcement")
    return success({ restored: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to restore announcement.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectToDatabase()
    const result = await AnnouncementModel.collection.deleteOne({ id })
    if (result.deletedCount === 0) return notFound("Announcement")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to permanently delete announcement.")
  }
}
