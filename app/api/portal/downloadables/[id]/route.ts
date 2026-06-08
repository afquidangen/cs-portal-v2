import mongoose from "mongoose"
import { v2 as cloudinary } from "cloudinary"
import { downloadablesRepository } from "@/features/portal/repositories/downloadables.repository"
import { success, error, notFound } from "@/lib/api-response"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const runtime = "nodejs"

function extractPublicId(url: string): string | null {
  const match = url.match(/\/raw\/upload\/v\d+\/(.+)/)
  return match ? match[1] : null
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const link = await downloadablesRepository.findOne({ _id: new mongoose.Types.ObjectId(id) })
    if (!link) return notFound("Downloadable")

    const href = (link as Record<string, unknown>)?.href as string | undefined
    if (href) {
      const publicId = extractPublicId(href)
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" })
      }
    }

    await downloadablesRepository.delete({ _id: new mongoose.Types.ObjectId(id) })
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete downloadable.")
  }
}
