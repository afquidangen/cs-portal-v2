import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const scheme = await gradingSchemeRepository.findById(id)
    if (!scheme) return notFound("Grading scheme")
    return success(scheme)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch grading scheme.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const scheme = await gradingSchemeRepository.update({ id }, body)
    if (!scheme) return notFound("Grading scheme")
    return success(scheme)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update grading scheme.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await gradingSchemeRepository.delete({ id })
    if (!deleted) return notFound("Grading scheme")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete grading scheme.")
  }
}
