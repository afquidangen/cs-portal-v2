import { curriculaRepository } from "@/features/portal/repositories/curricula.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const curricula = await curriculaRepository.findAll()
    return success(curricula)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch curricula.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.name) {
      return badRequest("Curriculum id and name are required.")
    }
    const curriculum = await curriculaRepository.create(body)
    return success(curriculum, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create curriculum.")
  }
}
