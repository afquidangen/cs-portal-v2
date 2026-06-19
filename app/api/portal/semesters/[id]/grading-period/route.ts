import { semestersRepository } from "@/features/portal/repositories/semesters.repository"
import { success, error, notFound, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    if (!body.gradingPeriod || !["Midterm", "Final"].includes(body.gradingPeriod)) {
      return badRequest("Invalid grading period.")
    }
    const semester = await semestersRepository.update({ id }, { gradingPeriod: body.gradingPeriod })
    if (!semester) return notFound("Semester")
    return success(semester)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update grading period.")
  }
}
