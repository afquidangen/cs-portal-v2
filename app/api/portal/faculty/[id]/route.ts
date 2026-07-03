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
    const entry = await facultyRepository.update({ id }, body)
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
    const deleted = await facultyRepository.softDelete({ id })
    if (!deleted) return notFound("Faculty")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete faculty.")
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await _request.json()
    if (body.restore) {
      const restored = await facultyRepository.restore({ id })
      if (!restored) return notFound("Faculty")
      return success({ restored: true })
    }
    if (body.hardDelete) {
      const deleted = await facultyRepository.delete({ id })
      if (!deleted) return notFound("Faculty")
      return success({ deleted: true })
    }
    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to process faculty request.")
  }
}
