import { semestersRepository } from "@/features/portal/repositories/semesters.repository"
import { success, error, notFound } from "@/lib/api-response"

export const runtime = "nodejs"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const semester = await semestersRepository.update({ id }, {
      status: "Archived",
      archivedAt: new Date().toISOString(),
    })
    if (!semester) return notFound("Semester")
    return success(semester)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to archive semester.")
  }
}
