import { rosterRepository } from "@/features/portal/repositories/roster.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const student = await rosterRepository.findById(id)
    if (!student) return notFound("Roster entry")
    return success(student)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch roster entry.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const student = await rosterRepository.update({ id }, { $set: body })
    if (!student) return notFound("Roster entry")
    return success(student)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update roster entry.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await rosterRepository.delete({ id })
    if (!deleted) return notFound("Roster entry")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete roster entry.")
  }
}
