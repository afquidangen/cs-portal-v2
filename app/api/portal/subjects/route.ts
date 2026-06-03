import { subjectsRepository } from "@/features/portal/repositories/subjects.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const subjects = await subjectsRepository.findAll()
    return success(subjects)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch subjects.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.code) {
      return badRequest("Subject code is required.")
    }
    const subject = await subjectsRepository.create(body)
    return success(subject, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create subject.")
  }
}
