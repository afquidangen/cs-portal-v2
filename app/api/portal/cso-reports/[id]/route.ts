import { csoReportsRepository } from "@/features/portal/repositories/cso-reports.repository"
import { success, error, notFound } from "@/lib/api-response"
import { uploadFile, destroyFile, deleteFile } from "@/lib/cloudinary"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await csoReportsRepository.findById(id)
    if (!report) return notFound("CSO report")
    return success(report)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch CSO report.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (typeof body.image === "string" && body.image.startsWith("data:")) {
      try {
        const existing = await csoReportsRepository.findById(id) as Record<string, unknown> | null
        const existingPublicId = existing?.cloudinaryPublicId as string | undefined
        if (existingPublicId) {
          await destroyFile(existingPublicId, "image")
        } else {
          const existingImage = existing?.image as string | undefined
          if (existingImage) {
            await deleteFile(existingImage)
          }
        }

        const result = await uploadFile(body.image, `cso-report-${Date.now()}`, "cso-reports", "image")
        body.image = result.secureUrl
        body.cloudinaryPublicId = result.publicId
      } catch {
        console.error("Cloudinary upload failed, keeping base64 image.")
      }
    }

    const report = await csoReportsRepository.update({ id }, { $set: body })
    if (!report) return notFound("CSO report")
    return success(report)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update CSO report.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await csoReportsRepository.findById(id) as Record<string, unknown> | null
    if (!report) return notFound("CSO report")

    const cloudinaryPublicId = report?.cloudinaryPublicId as string | undefined
    if (cloudinaryPublicId) {
      try {
        await destroyFile(cloudinaryPublicId, "image")
      } catch {
        console.error("Cloudinary destroy failed for publicId:", cloudinaryPublicId)
      }
    } else {
      const image = report?.image as string | undefined
      if (image) {
        try {
          await deleteFile(image)
        } catch {
          console.error("Cloudinary delete failed for image URL")
        }
      }
    }

    const deleted = await csoReportsRepository.delete({ id })
    if (!deleted) return notFound("CSO report")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete CSO report.")
  }
}
