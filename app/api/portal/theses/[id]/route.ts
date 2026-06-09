import { v2 as cloudinary } from "cloudinary"

import { thesesRepository } from "@/features/portal/repositories/theses.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const thesis = await thesesRepository.findById(id)
    if (!thesis) return notFound("Thesis")
    return success(thesis)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch thesis.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const thesis = await thesesRepository.update({ id }, { $set: body })
    if (!thesis) return notFound("Thesis")
    return success(thesis)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update thesis.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const thesis = await thesesRepository.findById(id)
    if (!thesis) return notFound("Thesis")

    const record = thesis as Record<string, unknown>
    if (record.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(record.cloudinaryPublicId as string, {
        resource_type: "raw",
      })
    }

    await thesesRepository.delete({ id })
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete thesis.")
  }
}
