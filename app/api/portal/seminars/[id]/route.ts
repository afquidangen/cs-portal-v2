import { seminarsRepository } from "@/features/portal/repositories/seminars.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const seminar = await seminarsRepository.findById(id)
    if (!seminar) return notFound("Seminar")
    return success(seminar)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch seminar.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const seminar = await seminarsRepository.update({ id }, { $set: body })
    if (!seminar) return notFound("Seminar")
    return success(seminar)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update seminar.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await seminarsRepository.delete({ id })
    if (!deleted) return notFound("Seminar")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete seminar.")
  }
}
