import { connectToDatabase } from "@/lib/mongodb"
import { GradeModel, ScheduleModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"
import { recomputeDeansListForSemester } from "@/features/portal/lib/deans-list-utils"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { classId, studentId, period, action, reason } = body
    if (!classId || !studentId || !period || !action) {
      return badRequest("classId, studentId, period, and action are required.")
    }
    if (period !== "midterm" && period !== "final") {
      return badRequest("period must be 'midterm' or 'final'.")
    }
    if (action !== "release" && action !== "unrelease") {
      return badRequest("action must be 'release' or 'unrelease'.")
    }

    await connectToDatabase()

    const grade = await GradeModel.findOne({ classId, studentId }).lean()
    if (!grade) {
      return badRequest("Grade record not found.")
    }

    const releasedField = period === "midterm" ? "midtermReleased" : "finalReleased"
    const historyField = period === "midterm" ? "midtermReleaseHistory" : "finalReleaseHistory"

    const history = ((grade as unknown as Record<string, unknown>)[historyField] ?? []) as Array<Record<string, unknown>>

    if (action === "unrelease") {
      if (!reason?.trim()) {
        return badRequest("Reason is required when unreleasing grades.")
      }
      await GradeModel.updateOne(
        { classId, studentId },
        {
          $set: { [releasedField]: false },
          $push: { [historyField]: { action: "unreleased", reason: reason.trim(), timestamp: new Date().toISOString() } },
        }
      )
    } else {
      const lastAction = history.length > 0 ? history[history.length - 1].action : null
      const releaseAction = lastAction === "unreleased" ? "re-released" : "released"
      await GradeModel.updateOne(
        { classId, studentId },
        {
          $set: { [releasedField]: true },
          $push: { [historyField]: { action: releaseAction, reason: reason?.trim(), timestamp: new Date().toISOString() } },
        }
      )
    }

    const updated = await GradeModel.findOne({ classId, studentId }).lean()

    const schedule = await ScheduleModel.findOne({ id: classId }).lean()
    if (schedule?.semesterId) {
      recomputeDeansListForSemester(schedule.semesterId).catch((dlErr) =>
        console.warn("[DeansList] Auto re-evaluation failed after student release:", dlErr)
      )
    }

    return success({ data: updated })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to process student release.")
  }
}
