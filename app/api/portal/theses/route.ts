import { thesesRepository } from "@/features/portal/repositories/theses.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const theses = await thesesRepository.findAll()
    return success(theses)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch theses.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.title) {
      return badRequest("Thesis id and title are required.")
    }
    const thesis = await thesesRepository.create(body)
    return success(thesis, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create thesis.")
  }
}
