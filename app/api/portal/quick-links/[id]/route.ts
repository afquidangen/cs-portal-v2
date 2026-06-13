import mongoose from "mongoose"
import { quickLinksRepository } from "@/features/portal/repositories/quick-links.repository"
import { success, error, notFound } from "@/lib/api-response"
import { deleteFile, uploadFile } from "@/lib/cloudinary"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const link = await quickLinksRepository.findOne({ _id: new mongoose.Types.ObjectId(id) })
    if (!link) return notFound("Quick link")
    return success(link)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch quick link.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await quickLinksRepository.findOne({ _id: new mongoose.Types.ObjectId(id) }) as Record<string, unknown> | null

    const update: Record<string, unknown> = {
      label: body.label,
      href: body.href,
    }

    if (body.imageData && typeof body.imageData === "string" && body.imageData.startsWith("data:")) {
      if (existing?.cloudinaryPublicId) {
        await deleteFile((existing as Record<string, unknown>).imageUrl as string).catch(() => {})
      }
      const result = await uploadFile(body.imageData, `quicklink-image-${Date.now()}`, "quick-links", "image")
      update.imageUrl = result.secureUrl
      update.cloudinaryPublicId = result.publicId
    } else if (body.removeImage) {
      if (existing?.cloudinaryPublicId) {
        await deleteFile((existing as Record<string, unknown>).imageUrl as string).catch(() => {})
      }
      update.imageUrl = null
      update.cloudinaryPublicId = null
    } else if (existing?.imageUrl) {
      update.imageUrl = existing.imageUrl
      update.cloudinaryPublicId = existing.cloudinaryPublicId
    }

    const link = await quickLinksRepository.update(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: update }
    )
    if (!link) return notFound("Quick link")
    return success(link)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update quick link.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await quickLinksRepository.findOne({ _id: new mongoose.Types.ObjectId(id) }) as Record<string, unknown> | null

    if (existing?.cloudinaryPublicId) {
      await deleteFile(existing.imageUrl as string).catch(() => {})
    }

    const deleted = await quickLinksRepository.delete({ _id: new mongoose.Types.ObjectId(id) })
    if (!deleted) return notFound("Quick link")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete quick link.")
  }
}
