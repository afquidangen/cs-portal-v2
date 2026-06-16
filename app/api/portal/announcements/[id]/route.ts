import { announcementsRepository } from "@/features/portal/repositories/announcements.repository"
import { connectToDatabase } from "@/lib/mongodb"
import { AnnouncementModel } from "@/lib/models"
import { success, error, notFound, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const announcement = await announcementsRepository.findById(id)
    if (!announcement) return notFound("Announcement")
    return success(announcement)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch announcement.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const announcement = await announcementsRepository.update({ id }, { $set: body })
    if (!announcement) return notFound("Announcement")
    return success(announcement)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update announcement.")
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await request.json()
    if (!userId) return badRequest("userId is required.")
    await connectToDatabase()
    const result = await AnnouncementModel.collection.updateOne(
      { id },
      { $addToSet: { readBy: userId } }
    )
    if (result.matchedCount === 0) return notFound("Announcement")
    return success({ updated: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to mark announcement as read.")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { deletedBy } = await request.json()
    await connectToDatabase()
    const result = await AnnouncementModel.collection.updateOne(
      { id },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy || null,
        },
      }
    )
    if (result.matchedCount === 0) return notFound("Announcement")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete announcement.")
  }
}
