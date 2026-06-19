import { feedbackRepository } from "@/features/portal/repositories/feedback.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ticket = await feedbackRepository.findById(id)
    if (!ticket) return notFound("Feedback ticket")
    return success(ticket)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch feedback ticket.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const ticket = await feedbackRepository.update({ id }, body)
    if (!ticket) return notFound("Feedback ticket")
    return success(ticket)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update feedback ticket.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await feedbackRepository.delete({ id })
    if (!deleted) return notFound("Feedback ticket")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete feedback ticket.")
  }
}
