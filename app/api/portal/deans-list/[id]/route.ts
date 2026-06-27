import { connectToDatabase } from "@/lib/mongodb"
import { DeansListModel, GradeModel, SemesterModel, UserModel } from "@/lib/models"
import { success, error, badRequest, notFound } from "@/lib/api-response"
import { requireAdmin } from "@/lib/api-auth"
import { evaluateDeansList } from "@/features/portal/lib/deans-list-evaluator"

export const runtime = "nodejs"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const { id } = await params
    const body = await request.json() as { manualOverride: "none" | "include" | "exclude" }
    const { manualOverride } = body

    if (!["none", "include", "exclude"].includes(manualOverride)) {
      return badRequest("manualOverride must be 'none', 'include', or 'exclude'.")
    }

    await connectToDatabase()

    const existing = await DeansListModel.findOne({ id })
    if (!existing) return notFound("Dean's List entry")

    await DeansListModel.updateOne({ id }, { $set: { manualOverride } })

    if (manualOverride === "none") {
      try {
        const userGrades = await GradeModel.find({
          semesterId: existing.semesterId,
          studentId: existing.studentId,
          deletedAt: null,
        }).lean()

        const semester = await SemesterModel.findOne({ id: existing.semesterId }).lean()
        const user = await UserModel.findOne({ id: existing.studentId, role: "student" }).lean()

        if (user && semester) {
          const totalUnits = userGrades.reduce(
            (sum, g) => sum + ((g.units as number) ?? 0),
            0
          )
          const evalGrades = userGrades.map((g) => ({
            transmutedGrade: g.transmutedGrade,
            released: g.released,
            remarks: g.remarks,
            finalRemarks: g.finalRemarks,
            midtermRemarks: g.midtermRemarks,
            units: g.units,
            subject: g.subject,
            code: g.code,
          }))
          const result = evaluateDeansList(evalGrades, totalUnits)

          const entryData = {
            gwa: result.gwa,
            totalUnits,
            isQualified: result.isQualified,
            disqualificationReasons: result.reasons,
            needsRecalculation: false,
          }
          await DeansListModel.updateOne({ id }, { $set: entryData })
        }
      } catch (evalErr) {
        console.warn("[DeansList] Re-evaluation failed after override change:", evalErr)
      }
    }

    const updated = await DeansListModel.findOne({ id }).lean()

    return success(updated)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to update Dean's List entry.")
  }
}
