import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { GradeModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { transmuteGrade, getGradeRemarks } from "@/features/portal/lib/grade-engine"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { classId, status, studentIds } = body

    if (!classId || !status) {
      return badRequest("classId and status are required.")
    }

    const validStatuses = ["Draft", "Submitted", "Reviewed", "Approved", "Locked"]
    if (!validStatuses.includes(status)) {
      return badRequest(`Invalid status. Must be one of: ${validStatuses.join(", ")}`)
    }

    const filter: Record<string, unknown> = { classId }

    if (studentIds && Array.isArray(studentIds)) {
      filter.studentId = { $in: studentIds }
    }

    if (status === "Approved" || status === "Locked") {
      const grades = await GradeModel.find(filter).lean()
      for (const grade of grades) {
        const g = grade as unknown as Record<string, unknown>
        const setFields: Record<string, unknown> = {
          workflowStatus: status,
          released: true,
          midtermReleased: true,
          finalReleased: true,
          releasedMidtermGrade: g.midtermGrade,
          releasedMidtermTransmuted: g.midtermTransmuted,
          releasedMidtermRemarks: g.midtermRemarks,
          releasedTentativeFinalGrade: g.tentativeFinalGrade,
          releasedFinalTransmuted: g.finalTransmuted,
          releasedFinalRemarks: g.finalRemarks,
          updatedAt: new Date().toISOString(),
        }

        const rMidterm = g.midtermGrade as number | undefined
        const rFinal = g.tentativeFinalGrade as number | undefined
        if (rMidterm !== undefined && rFinal !== undefined) {
          const overallGrade = (rMidterm + rFinal) / 2
          const overallTransmuted = transmuteGrade(overallGrade)
          const overallRemarks = getGradeRemarks(overallTransmuted)
          setFields.releasedFinalGrade = overallGrade
          setFields.releasedTransmutedGrade = overallTransmuted
          setFields.releasedRemarks = overallRemarks
        }

        await GradeModel.updateOne({ _id: g._id as string }, { $set: setFields })
      }
      return success({ updated: grades.length })
    }

    const updated = await gradesRepository.updateMany(filter, {
      workflowStatus: status,
      released: false,
      updatedAt: new Date().toISOString(),
    })

    return success({ updated })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update grade status.")
  }
}
