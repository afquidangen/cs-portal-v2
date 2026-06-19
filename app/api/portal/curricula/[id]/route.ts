import { curriculaRepository } from "@/features/portal/repositories/curricula.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const curriculum = await curriculaRepository.findById(id)
    if (!curriculum) return notFound("Curriculum")
    return success(curriculum)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch curriculum.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const curriculum = await curriculaRepository.update({ id }, body)
    if (!curriculum) return notFound("Curriculum")
    return success(curriculum)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update curriculum.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await curriculaRepository.delete({ id })
    if (!deleted) return notFound("Curriculum")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete curriculum.")
  }
}
