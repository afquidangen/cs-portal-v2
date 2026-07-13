import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import {
  retrieveUndoData,
  deleteUndoData,
} from "@/features/portal/lib/import-template-engine"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { undoToken } = body

    if (!undoToken) return badRequest("undoToken is required.")

    const undoData = retrieveUndoData(undoToken)
    if (!undoData) {
      return badRequest(
        "Undo session expired or not found. Imports can only be undone within 10 minutes."
      )
    }

    const { gradeSnapshots, newColumnIds, classId } = undoData

    // Step 1: Restore grade docs to pre-import state
    let restoredGrades = 0
    for (const snapshot of gradeSnapshots) {
      const result = await gradesRepository.replace(
        { id: snapshot.id },
        snapshot.doc
      )
      if (result) restoredGrades++
    }

    // Step 2: Remove columns created during import
    let deletedColumns = 0
    if (newColumnIds.length > 0) {
      for (const colId of newColumnIds) {
        const result = await gradeColumnRepository.softDelete({ id: colId })
        if (result) deletedColumns++
      }
    }

    // Step 3: Cleanup undo cache
    deleteUndoData(undoToken)

    return success({
      restoredGrades,
      deletedColumns,
      classId,
    })
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Unable to undo import."
    )
  }
}
