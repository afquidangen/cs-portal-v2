import { thesesRepository } from "@/features/portal/repositories/theses.repository"
import { success, error, notFound } from "@/lib/api-response"
import { connectToDatabase } from "@/lib/mongodb"
import { ThesisModel } from "@/lib/models"

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
