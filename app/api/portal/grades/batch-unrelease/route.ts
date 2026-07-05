import { connectToDatabase } from "@/lib/mongodb"
import { GradeModel, ScheduleModel, UserModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { recomputeDeansListForSemester } from "@/features/portal/lib/deans-list-utils"
import { auditLogsRepository } from "@/features/portal/repositories/audit-logs.repository"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { classId, period, reason } = body
    if (!classId || !period || !reason) {
      return badRequest("classId, period, and reason are required.")
    }
    if (period !== "midterm" && period !== "final") {
      return badRequest("period must be 'midterm' or 'final'.")
    }

    await connectToDatabase()

    const grades = await GradeModel.find({ classId }).lean()
    if (grades.length === 0) {
      return success({ count: 0, message: "No grades found for this class." })
    }

    const timestamp = new Date().toISOString()
    const releasedField = period === "midterm" ? "midtermReleased" : "finalReleased"
    const historyField = period === "midterm" ? "midtermReleaseHistory" : "finalReleaseHistory"

    let count = 0
    const studentSubjectMap = new Map<string, Set<string>>()
    
    for (const grade of grades) {
      const g = grade as unknown as Record<string, unknown>
      
      if (!g[releasedField]) continue
      
      const studentId = g.studentId as string
      const subjectCode = g.code as string
      if (!studentSubjectMap.has(studentId)) {
        studentSubjectMap.set(studentId, new Set())
      }
      studentSubjectMap.get(studentId)!.add(subjectCode)
      
      const clearFields: Record<string, unknown> = { [releasedField]: false }
      
      const midtermReleased = period === "midterm" ? false : g.midtermReleased
      const finalReleased = period === "final" ? false : g.finalReleased
      if (!midtermReleased && !finalReleased) {
        clearFields.released = false
      }
      
      if (period === "midterm") {
        clearFields.releasedMidtermGrade = undefined
        clearFields.releasedMidtermTransmuted = undefined
        clearFields.releasedMidtermRemarks = undefined
      } else {
        clearFields.releasedTentativeFinalGrade = undefined
        clearFields.releasedFinalTransmuted = undefined
        clearFields.releasedFinalRemarks = undefined
      }
      
      clearFields.releasedFinalGrade = undefined
      clearFields.releasedTransmutedGrade = undefined
      clearFields.releasedRemarks = undefined
      
      await GradeModel.updateOne(
        { _id: g._id as string },
        {
          $set: clearFields,
          $push: { [historyField]: { action: "unreleased", reason: reason.trim(), timestamp } },
        }
      )
      count++
    }

    for (const [studentId, subjectCodes] of studentSubjectMap) {
      const user = await UserModel.findOne({ id: studentId }).lean()
      if (!user) continue
      
      const gradeHistory = ((user as Record<string, unknown>).gradeHistory ?? []) as Array<Record<string, unknown>>
      // Case-insensitive comparison to match curriculum module behavior
      const normalizedCodes = new Set(Array.from(subjectCodes).map(code => code.trim().toLowerCase().replace(/[^a-z0-9]/g, "")))
      const filteredHistory = gradeHistory.filter(
        (entry) => {
          const entryCode = (entry.subjectCode as string || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "")
          return !normalizedCodes.has(entryCode)
        }
      )
      
      if (filteredHistory.length !== gradeHistory.length) {
        await UserModel.updateOne(
          { id: studentId },
          { $set: { gradeHistory: filteredHistory } }
        )
      }
    }

    const schedule = await ScheduleModel.findOne({ id: classId }).lean()
    if (schedule?.semesterId) {
      recomputeDeansListForSemester(schedule.semesterId).catch((dlErr) =>
        console.warn("[DeansList] Auto re-evaluation failed after batch unrelease:", dlErr)
      )
    }

    // Audit logging
    const subject = (schedule as Record<string, unknown> | null)?.subject ?? ""
    const section = (schedule as Record<string, unknown> | null)?.section ?? ""
    
    const time = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " +
      new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    
    auditLogsRepository.create({
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actor: auth.user.name,
      action: `Unreleased ${period} grades for ${subject} (${section}) — ${count} student(s). Reason: ${reason}`,
      time,
    }).catch(() => {})

    return success({ count, message: `${count} grade(s) unreleased successfully.` })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to batch unrelease grades.")
  }
}
