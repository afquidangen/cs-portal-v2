import { rosterRepository } from "@/features/portal/repositories/roster.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const roster = await rosterRepository.findAll()
    return success(roster)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch roster.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.name) {
      return badRequest("Student id and name are required.")
    }
    const student = await rosterRepository.create(body)
    return success(student, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create roster entry.")
  }
}
