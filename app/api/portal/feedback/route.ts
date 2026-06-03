import { feedbackRepository } from "@/features/portal/repositories/feedback.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const tickets = await feedbackRepository.findAll()
    return success(tickets)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch feedback tickets.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.studentName) {
      return badRequest("Ticket id and studentName are required.")
    }
    const ticket = await feedbackRepository.create(body)
    return success(ticket, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create feedback ticket.")
  }
}
