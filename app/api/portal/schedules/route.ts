import { schedulesRepository } from "@/features/portal/repositories/schedules.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const schedules = await schedulesRepository.findAll()
    return success(schedules)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch schedules.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) {
      return badRequest("Schedule id is required.")
    }
    const schedule = await schedulesRepository.create(body)
    return success(schedule, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create schedule.")
  }
}
