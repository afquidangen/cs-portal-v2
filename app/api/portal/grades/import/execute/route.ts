import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import {
  retrieveImportData,
  deleteImportData,
  storeUndoData,
} from "@/features/portal/lib/import-template-engine"
import type { UndoData } from "@/features/portal/lib/import-template-engine"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { importToken } = body

    if (!importToken) return badRequest("importToken is required.")

    const parsedData = retrieveImportData(importToken)
    if (!parsedData) {
      return badRequest(
        "Import session expired or not found. Please re-upload the file."
      )
    }

    const { classId, studentUpdates, newColumns } = parsedData
    const warnings = [...parsedData.warnings]
    let columnsCreated = 0
    const createdColumnIds: string[] = []
    const newColIdMap = new Map<string, string>() // colKey → actual column ID

    // --------------------------------------------------
    // Step 0: Snapshot current grade docs for undo
    // --------------------------------------------------
    const gradeSnapshots: UndoData["gradeSnapshots"] = []
    for (const update of studentUpdates) {
      const grade = (await gradesRepository.findOne({
        studentId: update.studentId,
        classId,
      })) as Record<string, unknown> | null
      if (grade) {
        gradeSnapshots.push({
          id: grade.id as string,
          doc: { ...grade },
        })
      }
    }

    // --------------------------------------------------
    // Step 1: Create new GradeColumns
    // --------------------------------------------------
    if (newColumns.length > 0) {
      const orderMap = new Map<string, number>()

      for (const nc of newColumns) {
        const groupKey = `${nc.gradingPeriod}_${nc.category}`
        const existingCols = await gradeColumnRepository.findAll({
          classId,
          gradingPeriod: nc.gradingPeriod,
        }) as Array<{ category: string; order: number }>

        const existingMax = existingCols
          .filter(
            (c: any) =>
              c.category?.toLowerCase() === nc.category.toLowerCase()
          )
          .reduce(
            (max: number, c: any) => Math.max(max, c.order ?? 0),
            0
          )

        const nextOrder = orderMap.get(groupKey) ?? existingMax
        orderMap.set(groupKey, nextOrder + 1)

        const finalOrder = orderMap.get(groupKey)!
        const colId = `COL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

        await gradeColumnRepository.create({
          id: colId,
          classId,
          name: nc.name,
          displayName: nc.name,
          category: nc.category,
          gradingPeriod: nc.gradingPeriod,
          maxScore: nc.maxScore,
          order: finalOrder,
        })
        columnsCreated++
        createdColumnIds.push(colId)

        const colKey = `${nc.gradingPeriod}_${nc.category}_${nc.order}`
        newColIdMap.set(colKey, colId)
      }

      warnings.push(
        `${columnsCreated} new column(s) auto-created during import.`
      )
    }

    // --------------------------------------------------
    // Step 2: Update grade scores in DB
    // --------------------------------------------------
    let scoreUpdates = 0
    for (const update of studentUpdates) {
      const grade = await gradesRepository.findOne({
        studentId: update.studentId,
        classId,
      }) as Record<string, unknown> | null
      if (!grade) {
        warnings.push(
          `Grade record not found for student ${update.studentId}. Skipped.`
        )
        continue
      }

      const gradeCode = grade.code as string | undefined
      if (!gradeCode) {
        warnings.push(
          `Grade record for student ${update.studentId} has no subject code. Skipped.`
        )
        continue
      }

      const mergedScores = {
        ...((grade.scores as Record<string, number>) ?? {}),
        ...update.scores,
      }

      // Add new column scores using the real column IDs
      for (const [colKey, colId] of newColIdMap) {
        const ncsList = parsedData.newColumnScores.get(colKey)
        if (ncsList) {
          const entry = ncsList.find(
            (s: { studentId: string; score: number }) =>
              s.studentId === update.studentId
          )
          if (entry != null) {
            mergedScores[colId] = entry.score
          }
        }
      }

      // Save imported computed values for comparison later
      const computed = parsedData.computedValues.get(update.studentId) ?? {}
      const updates: Record<string, unknown> = {
        scores: mergedScores,
      }

      if (computed.midtermGrade !== undefined)
        updates.midtermGrade = computed.midtermGrade
      if (computed.midtermTransmuted !== undefined)
        updates.midtermTransmuted = computed.midtermTransmuted
      if (computed.midtermRemarks !== undefined)
        updates.midtermRemarks = computed.midtermRemarks
      if (computed.tentativeFinalGrade !== undefined)
        updates.tentativeFinalGrade = computed.tentativeFinalGrade
      if (computed.finalTransmuted !== undefined)
        updates.finalTransmuted = computed.finalTransmuted
      if (computed.finalRemarks !== undefined)
        updates.finalRemarks = computed.finalRemarks
      if (computed.finalGrade !== undefined)
        updates.finalGrade = computed.finalGrade
      if (computed.transmutedGrade !== undefined)
        updates.transmutedGrade = computed.transmutedGrade
      if (computed.remarks !== undefined) updates.remarks = computed.remarks

      const updatedDoc = await gradesRepository.update(
        {
          studentId: update.studentId,
          code: gradeCode,
          semesterId: (grade.semesterId as string) || null,
          classId,
        } as Record<string, unknown>,
        updates
      )
      if (!updatedDoc) {
        warnings.push(
          `Failed to update grade for student ${update.studentId}. No matching record found.`
        )
        continue
      }
      scoreUpdates += Object.keys(update.scores).length
      // Count new column scores for this student
      for (const [, ncsList] of parsedData.newColumnScores) {
        if (ncsList.some((s: any) => s.studentId === update.studentId)) {
          scoreUpdates++
        }
      }
    }

    // --------------------------------------------------
    // Step 3: Auto-compute midterm and final
    // --------------------------------------------------
    const computeWarnings: string[] = []
    const cookie = request.headers.get("cookie") || ""

    for (const gradingPeriod of ["midterm", "final"] as const) {
      try {
        const computeReq = new Request(
          "http://localhost/api/portal/grades/compute",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              cookie,
            },
            body: JSON.stringify({ classId, gradingPeriod }),
          }
        )

        const { POST: computePost } = await import(
          "../../compute/route"
        )
        const computeRes = await computePost(computeReq)

        if (!computeRes.ok) {
          const errBody = await computeRes
            .json()
            .catch(() => ({ error: "Unknown compute error" }))
          computeWarnings.push(
            `${gradingPeriod} compute warning: ${errBody.error}`
          )
        }
      } catch (computeErr) {
        computeWarnings.push(
          `${gradingPeriod} compute failed: ${computeErr instanceof Error ? computeErr.message : "Unknown error"}`
        )
      }
    }

    // --------------------------------------------------
    // Step 4: Store undo data & response
    // --------------------------------------------------
    const undoData: UndoData = {
      gradeSnapshots,
      newColumnIds: createdColumnIds,
      classId,
    }
    const undoToken = storeUndoData(undoData)
    deleteImportData(importToken)

    return success({
      processed: studentUpdates.length,
      columnsCreated,
      undoToken,
      scoreUpdates,
      warnings: [...warnings, ...computeWarnings],
      errors: [],
    })
  } catch (err) {
    return error(
      err instanceof Error ? err.message : "Unable to execute import."
    )
  }
}
