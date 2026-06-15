import { orgChartRepository } from "@/features/portal/repositories/org-chart.repository"
import { success, error, badRequest, notFound } from "@/lib/api-response"
import { uploadFile, deleteFile, destroyFile } from "@/lib/cloudinary"
import { requireCsoAccess } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function GET() {
  try {
    const records = await orgChartRepository.findAll() as Record<string, unknown>[]
    const record = records[0] ?? null
    return success(record)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch organizational chart.")
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireCsoAccess(request)
    if (auth instanceof Response) return auth
    const body = await request.json()
    if (!body.imageUrl) {
      return badRequest("Image data is required.")
    }

    let imageUrl = body.imageUrl
    let cloudinaryPublicId: string | undefined

    if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
      const result = await uploadFile(imageUrl, `org-chart-${Date.now()}`, "org-chart", "image")
      imageUrl = result.secureUrl
      cloudinaryPublicId = result.publicId
    }

    const existing = await orgChartRepository.findAll() as Record<string, unknown>[]
    let created
    if (existing.length > 0) {
      const existingRecord = existing[0]
      const existingImageUrl = existingRecord?.imageUrl as string | undefined
      if (existingImageUrl) {
        await deleteFile(existingImageUrl)
      }
      created = await orgChartRepository.update(
        { _id: existingRecord._id },
        { $set: { imageUrl, cloudinaryPublicId } }
      )
    } else {
      created = await orgChartRepository.create({ imageUrl, cloudinaryPublicId })
    }

    const raw = typeof created === "object" && created !== null && "toObject" in created
      ? (created as { toObject: () => Record<string, unknown> }).toObject()
      : created as Record<string, unknown>
    const record = { ...raw, _id: String(raw._id) }
    return success(record, 200)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to save organizational chart.")
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireCsoAccess(request)
    if (auth instanceof Response) return auth
    const records = await orgChartRepository.findAll() as Record<string, unknown>[]
    if (records.length === 0) return notFound("Organizational chart")

    const record = records[0] as Record<string, unknown>
    const cloudinaryPublicId = record?.cloudinaryPublicId as string | undefined

    if (cloudinaryPublicId) {
      await destroyFile(cloudinaryPublicId, "image")
    } else {
      const imageUrl = record?.imageUrl as string | undefined
      if (imageUrl) {
        await deleteFile(imageUrl)
      }
    }

    await orgChartRepository.deleteMany()
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete organizational chart.")
  }
}
