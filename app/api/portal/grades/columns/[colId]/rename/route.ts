import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { success, error, badRequest, notFound } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { GradeModel } from "@/lib/models"
import { connectToDatabase } from "@/lib/mongodb"

export const runtime = "nodejs"

function scoreKey(gradingPeriod: string, name: string): string {
  return gradingPeriod === "both" ? name : `${gradingPeriod}_${name}`
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
    const newName = body.name?.trim()
    if (!newName) {
      return badRequest("name is required.")
    }

    const existing = await gradeColumnRepository.findById(colId) as Record<string, unknown> | null
    if (!existing) return notFound("Column")
    const oldName = existing.name as string
    const gradingPeriod = existing.gradingPeriod as string
    const classId = existing.classId as string

    const updated = await gradeColumnRepository.update(
      { id: colId },
      { name: newName, displayName: newName }
    )
    if (!updated) return notFound("Column")

    const oldKey = scoreKey(gradingPeriod, oldName)
    const newKey = scoreKey(gradingPeriod, newName)

    if (oldKey !== newKey) {
      await connectToDatabase()
      await GradeModel.updateMany(
        { classId, [`scores.${oldKey}`]: { $exists: true } },
        [
          { $set: { [`scores.${newKey}`]: `$scores.${oldKey}` } },
          { $unset: [`scores.${oldKey}`] },
        ]
      )
    }

    return success(updated)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to rename column.")
  }
}
