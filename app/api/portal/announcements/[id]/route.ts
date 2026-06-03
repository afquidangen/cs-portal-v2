import { announcementsRepository } from "@/features/portal/repositories/announcements.repository"
import { success, error, notFound } from "@/lib/api-response"

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await announcementsRepository.delete({ id })
    if (!deleted) return notFound("Announcement")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete announcement.")
  }
}
