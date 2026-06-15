import { csoReportsRepository } from "@/features/portal/repositories/cso-reports.repository"
import { success, error, notFound } from "@/lib/api-response"
import { uploadFile, destroyFile, deleteFile } from "@/lib/cloudinary"
import { requireCsoAccess } from "@/lib/api-auth"

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
    const auth = await requireCsoAccess(request)
    if (auth instanceof Response) return auth
    const { id } = await params
    const body = await request.json()

    const existing = await csoReportsRepository.findById(id) as Record<string, unknown> | null
    if (existing) {
      const oldFile = existing?.file as string | undefined
      const oldPublicId = existing?.cloudinaryPublicId as string | undefined

      if (typeof body.file === "string" && body.file.startsWith("data:")) {
        if (oldPublicId) {
          const oldResourceType = oldFile?.includes("/raw/upload/") ? "raw" : "image"
          await destroyFile(oldPublicId, oldResourceType).catch(() => {})
        } else if (oldFile) {
          await deleteFile(oldFile).catch(() => {})
        }
        const isPdf = body.file.startsWith("data:application/pdf;")
        const resourceType = isPdf ? "raw" : "image"
        const publicId = isPdf ? `cso-report-${Date.now()}.pdf` : `cso-report-${Date.now()}`
        const result = await uploadFile(body.file, publicId, "cso-reports", resourceType)
        body.file = result.secureUrl
        body.cloudinaryPublicId = result.publicId
      } else if (oldFile && !body.file) {
        if (oldPublicId) {
          const oldResourceType = oldFile?.includes("/raw/upload/") ? "raw" : "image"
          await destroyFile(oldPublicId, oldResourceType).catch(() => {})
        } else {
          await deleteFile(oldFile).catch(() => {})
        }
        body.file = undefined
        body.fileName = undefined
        body.cloudinaryPublicId = undefined
      } else if (oldFile && body.file && body.file !== oldFile) {
        if (oldPublicId) {
          const oldResourceType = oldFile?.includes("/raw/upload/") ? "raw" : "image"
          await destroyFile(oldPublicId, oldResourceType).catch(() => {})
        } else {
          await deleteFile(oldFile).catch(() => {})
        }
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
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireCsoAccess(request)
    if (auth instanceof Response) return auth
    const { id } = await params
    const report = await csoReportsRepository.findById(id) as Record<string, unknown> | null
    if (!report) return notFound("CSO report")

    const cloudinaryPublicId = report?.cloudinaryPublicId as string | undefined
    const file = report?.file as string | undefined
    if (cloudinaryPublicId) {
      const resourceType = file?.includes("/raw/upload/") ? "raw" : "image"
      await destroyFile(cloudinaryPublicId, resourceType).catch(() => {
        const fallback = resourceType === "raw" ? "image" : "raw"
        return destroyFile(cloudinaryPublicId, fallback)
      }).catch((err) => {
        console.error("Cloudinary destroy failed for publicId:", cloudinaryPublicId, err)
      })
    } else if (file) {
      await deleteFile(file).catch((err) => {
        console.error("Cloudinary delete failed for file URL:", err)
      })
    }

    const deleted = await csoReportsRepository.delete({ id })
    if (!deleted) return notFound("CSO report")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete CSO report.")
  }
}
