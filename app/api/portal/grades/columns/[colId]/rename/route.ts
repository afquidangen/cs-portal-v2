import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { success, error, badRequest, notFound } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ colId: string }> }
) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const { colId } = await params
    const body = await request.json()
    if (!body.name || !body.name.trim()) {
      return badRequest("name is required.")
    }

    const updated = await gradeColumnRepository.update(
      { id: colId },
      { name: body.name.trim(), displayName: body.name.trim() }
    )
    if (!updated) return notFound("Column")
    return success(updated)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to rename column.")
  }
}
