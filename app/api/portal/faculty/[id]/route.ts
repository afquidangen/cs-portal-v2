import { facultyRepository } from "@/features/portal/repositories/faculty.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const entry = await facultyRepository.findById(id)
    if (!entry) return notFound("Faculty")
    return success(entry)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch faculty.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const entry = await facultyRepository.update({ id }, { $set: body })
    if (!entry) return notFound("Faculty")
    return success(entry)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update faculty.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await facultyRepository.delete({ id })
    if (!deleted) return notFound("Faculty")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete faculty.")
  }
}
