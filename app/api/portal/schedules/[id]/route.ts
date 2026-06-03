import { schedulesRepository } from "@/features/portal/repositories/schedules.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const schedule = await schedulesRepository.findById(id)
    if (!schedule) return notFound("Schedule")
    return success(schedule)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch schedule.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const schedule = await schedulesRepository.update({ id }, { $set: body })
    if (!schedule) return notFound("Schedule")
    return success(schedule)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update schedule.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await schedulesRepository.delete({ id })
    if (!deleted) return notFound("Schedule")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete schedule.")
  }
}
