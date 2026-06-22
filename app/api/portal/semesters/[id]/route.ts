import { semestersRepository } from "@/features/portal/repositories/semesters.repository"
import { success, error, notFound } from "@/lib/api-response"
import { SemesterModel } from "@/lib/models"

export const runtime = "nodejs"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const semester = await semestersRepository.findById(id)
    if (!semester) return notFound("Semester")
    return success(semester)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch semester.")
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { _id, __v, createdAt, updatedAt, ...clean } = body
    if (clean.status === "Active") {
      await SemesterModel.updateMany({ status: "Active" }, { $set: { status: "Inactive" } })
    }
    const semester = await semestersRepository.update({ id }, clean)
    if (!semester) return notFound("Semester")
    return success(semester)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update semester.")
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const deleted = await semestersRepository.delete({ id })
    if (!deleted) return notFound("Semester")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete semester.")
  }
}
