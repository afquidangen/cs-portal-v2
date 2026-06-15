import mongoose from "mongoose"
import { galleryRepository } from "@/features/portal/repositories/gallery.repository"
import { success, error, notFound } from "@/lib/api-response"
import { destroyFile, uploadFile } from "@/lib/cloudinary"
import { requireCsoAccess } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await galleryRepository.findOne({ _id: new mongoose.Types.ObjectId(id) })
    if (!item) return notFound("Gallery item")
    return success(item)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch gallery item.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireCsoAccess(request)
    if (auth instanceof Response) return auth
    const { id } = await params
    const body = await request.json()

    const existing = await galleryRepository.findOne({ _id: new mongoose.Types.ObjectId(id) }) as Record<string, unknown> | null
    if (!existing) return notFound("Gallery item")

    const update: Record<string, unknown> = {
      title: body.title,
      description: body.description ?? "",
    }

    if (typeof body.image === "string" && body.image.startsWith("data:")) {
      if (existing.cloudinaryPublicId) {
        await destroyFile(existing.cloudinaryPublicId as string, "image").catch(() => {})
      }
      const result = await uploadFile(body.image, `gallery-${Date.now()}`, "gallery", "image")
      update.image = result.secureUrl
      update.cloudinaryPublicId = result.publicId
    } else if (body.removeImage) {
      if (existing.cloudinaryPublicId) {
        await destroyFile(existing.cloudinaryPublicId as string, "image").catch(() => {})
      }
      update.image = null
      update.cloudinaryPublicId = null
    } else {
      update.image = existing.image
      update.cloudinaryPublicId = existing.cloudinaryPublicId
    }

    const updated = await galleryRepository.update(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: update }
    )
    if (!updated) return notFound("Gallery item")
    return success(updated)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update gallery item.")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireCsoAccess(request)
    if (auth instanceof Response) return auth
    const { id } = await params
    const existing = await galleryRepository.findOne({ _id: new mongoose.Types.ObjectId(id) }) as Record<string, unknown> | null

    if (existing?.cloudinaryPublicId) {
      await destroyFile(existing.cloudinaryPublicId as string, "image").catch(() => {})
    }

    const deleted = await galleryRepository.delete({ _id: new mongoose.Types.ObjectId(id) })
    if (!deleted) return notFound("Gallery item")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete gallery item.")
  }
}
