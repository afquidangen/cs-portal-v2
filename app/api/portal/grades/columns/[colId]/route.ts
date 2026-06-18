import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { success, error, notFound, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { GradeModel } from "@/lib/models"

export const runtime = "nodejs"

function scoreKey(col: { name: string; gradingPeriod?: string }) {
  return col.gradingPeriod && col.gradingPeriod !== "both"
    ? `${col.gradingPeriod}_${col.name}`
    : col.name
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ colId: string }> }
) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const { colId } = await params
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.maxScore !== undefined) {
      const ms = Number(body.maxScore)
      if (isNaN(ms) || ms < 0) return badRequest("maxScore must be a non-negative number.")
      updates.maxScore = ms
    }
    if (body.width !== undefined) {
      const w = Number(body.width)
      if (isNaN(w) || w < 0) return badRequest("width must be a non-negative number.")
      updates.width = w
    }
    if (body.displayName !== undefined) updates.displayName = body.displayName
    if (body.category !== undefined) updates.category = body.category

    if (Object.keys(updates).length === 0) {
      return badRequest("No valid fields to update.")
    }

    const updated = await gradeColumnRepository.update({ id: colId }, { $set: updates })
    if (!updated) return notFound("Column")
    return success(updated)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update column.")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ colId: string }> }
) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const { colId } = await params
    const column = await gradeColumnRepository.findById(colId) as {
      classId: string
      name: string
      gradingPeriod?: string
    } | null
    if (!column) return notFound("Column")

    const deleted = await gradeColumnRepository.delete({ id: colId })
    if (!deleted) return notFound("Column")

    const keys = Array.from(new Set([column.name, scoreKey(column)]))
    const unsetScores = keys.reduce<Record<string, "">>((acc, key) => {
      acc[`scores.${key}`] = ""
      acc[`maxScores.${key}`] = ""
      return acc
    }, {})
    await GradeModel.updateMany(
      { classId: column.classId },
      { $unset: unsetScores, $set: { updatedAt: new Date().toISOString() } }
    )

    return success({ deleted: true })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to delete column.")
  }
}
