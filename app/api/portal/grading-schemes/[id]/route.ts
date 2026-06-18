import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { success, error, notFound, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

function validateScheme(body: Record<string, unknown>): string[] {
  const errors: string[] = []
  const components = (body.components ?? []) as Array<Record<string, unknown>>
  const compTotal = components.reduce((s, c) => s + (c.weight as number), 0)
  if (Math.abs(compTotal - 100) > 0.01) errors.push(`Component weights sum to ${compTotal}%, must be 100%.`)
  if (body.subjectType === "Lecture with Lab") {
    const lectureWeight = (body.lectureWeight as number) ?? 0
    const laboratoryWeight = (body.laboratoryWeight as number) ?? 0
    if (lectureWeight + laboratoryWeight !== 100) {
      errors.push(`Lecture weight (${lectureWeight}%) + Laboratory weight (${laboratoryWeight}%) must equal 100%.`)
    }
  }
  return errors
}

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
    const validationErrors = validateScheme(body)
    if (validationErrors.length > 0) return badRequest(validationErrors.join(" | "))
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
