import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { success, error, notFound, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ colId: string }> }
) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const { colId } = await params
    const deleted = await gradeColumnRepository.delete({ id: colId })
    if (!deleted) return notFound("Column")
    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete column.")
  }
}
