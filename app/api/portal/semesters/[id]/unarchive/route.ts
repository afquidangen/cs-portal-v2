import { connectToDatabase } from "@/lib/mongodb"
import { semestersRepository } from "@/features/portal/repositories/semesters.repository"
import { success, error, notFound } from "@/lib/api-response"
import { recomputeDeansListForSemester } from "@/features/portal/lib/deans-list-utils"

export const runtime = "nodejs"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const semester = await semestersRepository.update({ id }, {
      status: "Inactive",
      archivedAt: null,
    })
    if (!semester) return notFound("Semester")

    try {
      await recomputeDeansListForSemester(id)
    } catch (dlErr) {
      console.warn("Dean's List re-evaluation failed during unarchive:", dlErr)
    }

    return success(semester)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to unarchive semester.")
  }
}
