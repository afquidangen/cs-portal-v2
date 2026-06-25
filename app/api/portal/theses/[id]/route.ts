import { thesesRepository } from "@/features/portal/repositories/theses.repository"
import { success, error, notFound } from "@/lib/api-response"
import { connectToDatabase } from "@/lib/mongodb"
import { ThesisModel } from "@/lib/models"
import { uploadFile, destroyFile } from "@/lib/cloudinary"

export const runtime = "nodejs"

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

    if (typeof body.pdfUrl === "string" && body.pdfUrl.startsWith("data:")) {
      const result = await uploadFile(body.pdfUrl, `thesis-${Date.now()}`, "theses")
      body.pdfUrl = result.secureUrl
      body.cloudinaryPublicId = result.publicId

      const existing = await thesesRepository.findById(id) as Record<string, unknown> | null
      if (existing) {
        const oldPublicId = existing.cloudinaryPublicId as string | undefined
        if (oldPublicId) await destroyFile(oldPublicId, "raw").catch(() => {})
      }
    }

    const thesis = await thesesRepository.update({ id }, body)
    if (!thesis) return notFound("Thesis")
    return success(thesis)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update thesis.")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const thesis = await thesesRepository.findById(id)
    if (!thesis) return notFound("Thesis")

    const { deletedBy } = await request.json().catch(() => ({}))

    await connectToDatabase()
    await ThesisModel.collection.updateOne(
      { id },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy || null,
        },
      }
    )

    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete thesis.")
  }
}
