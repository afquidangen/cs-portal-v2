import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const grade = await gradesRepository.findById(id)
    if (!grade) return notFound("Grade")
    return success(grade)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch grade.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const grade = await gradesRepository.update({ id }, { $set: body })
    if (!grade) return notFound("Grade")
    return success(grade)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update grade.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await gradesRepository.delete({ id })
    if (!deleted) return notFound("Grade")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete grade.")
  }
}
