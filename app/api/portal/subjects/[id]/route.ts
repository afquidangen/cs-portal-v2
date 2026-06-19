import { subjectsRepository } from "@/features/portal/repositories/subjects.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const subject = await subjectsRepository.findById(id)
    if (!subject) return notFound("Subject")
    return success(subject)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch subject.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const subject = await subjectsRepository.update({ id }, body)
    if (!subject) return notFound("Subject")
    return success(subject)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update subject.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await subjectsRepository.delete({ id })
    if (!deleted) return notFound("Subject")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete subject.")
  }
}
