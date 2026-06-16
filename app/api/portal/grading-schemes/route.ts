import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { success, error } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const schemes = await gradingSchemeRepository.findAll()
    return success(schemes)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch grading schemes.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const scheme = await gradingSchemeRepository.create({
      id: `GS-${Date.now()}`,
      ...body,
    })
    return success(scheme, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create grading scheme.")
  }
}
