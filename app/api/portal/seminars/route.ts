import { seminarsRepository } from "@/features/portal/repositories/seminars.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const seminars = await seminarsRepository.findAll()
    return success(seminars)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch seminars.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.title) {
      return badRequest("Seminar id and title are required.")
    }
    const seminar = await seminarsRepository.create(body)
    return success(seminar, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create seminar.")
  }
}
