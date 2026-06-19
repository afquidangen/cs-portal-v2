import { semestersRepository } from "@/features/portal/repositories/semesters.repository"
import { success, error, notFound } from "@/lib/api-response"
import { SemesterModel } from "@/lib/models"

export const runtime = "nodejs"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await SemesterModel.updateMany({ status: "Active" }, { $set: { status: "Inactive" } })
    const semester = await semestersRepository.update({ id }, { status: "Active" })
    if (!semester) return notFound("Semester")
    return success(semester)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to activate semester.")
  }
}
