import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const schemes = await gradingSchemeRepository.findAll()
    return success(schemes)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch grading schemes.")
  }
}

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validationErrors = validateScheme(body)
    if (validationErrors.length > 0) return badRequest(validationErrors.join(" | "))
    const scheme = await gradingSchemeRepository.create({
      id: `GS-${Date.now()}`,
      ...body,
    })
    return success(scheme, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create grading scheme.")
  }
}
