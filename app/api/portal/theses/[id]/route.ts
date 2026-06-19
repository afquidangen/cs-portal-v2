import { thesesRepository } from "@/features/portal/repositories/theses.repository"
import { success, error, notFound } from "@/lib/api-response"
import { deleteFile } from "@/lib/cloudinary"

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
    const thesis = await thesesRepository.update({ id }, body)
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
    const pdfUrl = record.pdfUrl as string | undefined
    if (pdfUrl) {
      await deleteFile(pdfUrl)
    }

    await thesesRepository.delete({ id })
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete thesis.")
  }
}
