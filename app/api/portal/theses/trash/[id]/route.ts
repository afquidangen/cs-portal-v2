import { thesesRepository } from "@/features/portal/repositories/theses.repository"
import { success, error, notFound } from "@/lib/api-response"
import { connectToDatabase } from "@/lib/mongodb"
import { ThesisModel } from "@/lib/models"
import { destroyFile, deleteFile } from "@/lib/cloudinary"

export const runtime = "nodejs"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectToDatabase()
    const result = await ThesisModel.collection.updateOne(
      { id },
      { $set: { isDeleted: false, deletedAt: null, deletedBy: null } }
    )
    if (result.matchedCount === 0) return notFound("Thesis")
    return success({ restored: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to restore thesis.")
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
    const cloudinaryPublicId = record.cloudinaryPublicId as string | undefined
    const pdfUrl = record.pdfUrl as string | undefined

    if (cloudinaryPublicId) {
      await destroyFile(cloudinaryPublicId, "raw")
    } else if (pdfUrl) {
      await deleteFile(pdfUrl)
    }

    await connectToDatabase()
    const result = await ThesisModel.collection.deleteOne({ id })
    if (result.deletedCount === 0) return notFound("Thesis")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to permanently delete thesis.")
  }
}
