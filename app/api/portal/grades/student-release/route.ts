import { connectToDatabase } from "@/lib/mongodb"
import { GradeModel, ScheduleModel, UserModel, SemesterModel, PushSubscriptionModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"
import { transmuteGrade, getGradeRemarks } from "@/features/portal/lib/grade-engine"
import { recomputeDeansListForSemester } from "@/features/portal/lib/deans-list-utils"
import { sendGradeReleasedEmail } from "@/features/portal/services/email"
import { sendPushToSubscriptions } from "@/lib/web-push"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { auditLogsRepository } from "@/features/portal/repositories/audit-logs.repository"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

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

    const g = grade as unknown as Record<string, unknown>
    const releasedField = period === "midterm" ? "midtermReleased" : "finalReleased"
    const historyField = period === "midterm" ? "midtermReleaseHistory" : "finalReleaseHistory"

    const history = ((g)[historyField] ?? []) as Array<Record<string, unknown>>

    if (action === "unrelease") {
      if (!reason?.trim()) {
        return badRequest("Reason is required when unreleasing grades.")
      }
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
        clearFields.releasedFinalGrade = undefined
        clearFields.releasedTransmutedGrade = undefined
        clearFields.releasedRemarks = undefined
      } else {
        clearFields.releasedTentativeFinalGrade = undefined
        clearFields.releasedFinalTransmuted = undefined
        clearFields.releasedFinalRemarks = undefined
        clearFields.releasedFinalGrade = undefined
        clearFields.releasedTransmutedGrade = undefined
        clearFields.releasedRemarks = undefined
      }
      await GradeModel.updateOne(
        { classId, studentId },
        {
          $set: clearFields,
          $unset: {
            releasedFinalGrade: "",
            releasedTransmutedGrade: "",
            releasedRemarks: "",
          },
          $push: { [historyField]: { action: "unreleased", reason: reason.trim(), timestamp: new Date().toISOString() } },
        }
      )

      const user = await UserModel.findOne({ id: studentId }).lean()
      if (user) {
        const gradeHistory = (user.gradeHistory ?? []) as Array<Record<string, unknown>>
        // Case-insensitive comparison to match curriculum module behavior
        const targetCode = (g.code as string || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "")
        const filteredHistory = gradeHistory.filter(
          (entry) => {
            const entryCode = (entry.subjectCode as string || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "")
            return entryCode !== targetCode
          }
        )
        if (filteredHistory.length !== gradeHistory.length) {
          await UserModel.updateOne(
            { id: studentId },
            { $set: { gradeHistory: filteredHistory } }
          )
        }
      }
    } else {
      const lastAction = history.length > 0 ? history[history.length - 1].action : null
      const releaseAction = lastAction === "unreleased" ? "re-released" : "released"

      const setFields: Record<string, unknown> = { [releasedField]: true }

      if (period === "midterm") {
        setFields.releasedMidtermGrade = g.midtermGrade
        setFields.releasedMidtermTransmuted = g.midtermTransmuted
        setFields.releasedMidtermRemarks = g.midtermRemarks
      } else {
        setFields.releasedTentativeFinalGrade = g.tentativeFinalGrade
        setFields.releasedFinalTransmuted = g.finalTransmuted
        setFields.releasedFinalRemarks = g.finalRemarks
      }

      const midtermReleased = period === "midterm" ? true : g.midtermReleased
      const finalReleased = period === "final" ? true : g.finalReleased

      if (midtermReleased && finalReleased) {
        const rMidterm = (period === "midterm" ? g.midtermGrade : g.releasedMidtermGrade) as number | undefined
        const rFinal = (period === "final" ? g.tentativeFinalGrade : g.releasedTentativeFinalGrade) as number | undefined

        if (rMidterm !== undefined && rFinal !== undefined) {
          const overallGrade = (rMidterm + rFinal) / 2
          const overallTransmuted = transmuteGrade(overallGrade)
          const overallRemarks = getGradeRemarks(overallTransmuted)
          setFields.releasedFinalGrade = overallGrade
          setFields.releasedTransmutedGrade = overallTransmuted
          setFields.releasedRemarks = overallRemarks
        }
      }

      await GradeModel.updateOne(
        { classId, studentId },
        {
          $set: setFields,
          $push: { [historyField]: { action: releaseAction, reason: reason?.trim(), timestamp: new Date().toISOString() } },
        }
      )

      // Update gradeHistory for curriculum and appraisal sheet sync
      const user = await UserModel.findOne({ id: studentId })
      if (user) {
        const history = user.gradeHistory ? [...user.gradeHistory] : []
        const finalGrade = g.finalGrade as number | undefined
        const transmuted = finalGrade !== undefined ? transmuteGrade(finalGrade) : undefined
        const remarks = g.remarks ?? getGradeRemarks(transmuted ?? 5.0)

        const existingIdx = history.findIndex((h) => h.subjectCode === g.code)
        const entry = {
          subjectCode: g.code as string,
          subjectName: g.subject as string,
          finalPercentile: finalGrade ?? 0,
          transmutedGrade: transmuted ?? 0,
          remarks: remarks as string,
          section: g.section as string,
          curriculumId: (user as any).curriculumId ?? "",
          yearLevel: (user as any).currentYearLevel ?? "",
          semester: (user as any).currentSemester ?? "",
        }

        if (existingIdx >= 0) {
          history[existingIdx] = { ...history[existingIdx], ...entry }
        } else {
          history.push(entry)
        }

        await UserModel.updateOne({ id: studentId }, { $set: { gradeHistory: history } })

        // Send notification for re-release
        if (user.email) {
          const schedule = await ScheduleModel.findOne({ id: classId }).lean()
          const semester = schedule?.semesterId
            ? await SemesterModel.findOne({ id: schedule.semesterId }).lean()
            : null
          
          const semesterName = ((semester as Record<string, unknown> | null)?.semester ?? "") as string
          const syStart = ((semester as Record<string, unknown> | null)?.schoolYearStart ?? 0) as number
          const syEnd = ((semester as Record<string, unknown> | null)?.schoolYearEnd ?? 0) as number
          const facultyName = (schedule as Record<string, unknown> | null)?.instructor as string
          
          // Send email
          await sendGradeReleasedEmail({
            studentId,
            studentName: user.name,
            email: user.email,
            semester: semesterName,
            schoolYearStart: syStart,
            schoolYearEnd: syEnd,
            facultyName,
          })
          
          // Send push notification if enabled
          if (user.pushNotificationsEnabled !== false) {
            const subscriptions = await PushSubscriptionModel.find({ userId: studentId }).lean()
            if (subscriptions.length > 0) {
              const subjectName = (schedule as Record<string, unknown> | null)?.subject ?? ""
              await sendPushToSubscriptions(subscriptions, {
                title: "Student Portal",
                body: `Your ${period === "midterm" ? "midterm" : "final"} grade for ${subjectName} has been updated.`,
                icon: "/logo-source.svg",
                url: "/student",
              })
            }
          }
        }
      }
    }

    const updated = await GradeModel.findOne({ classId, studentId }).lean()

    const schedule = await ScheduleModel.findOne({ id: classId }).lean()
    if (schedule?.semesterId) {
      recomputeDeansListForSemester(schedule.semesterId).catch((dlErr) =>
        console.warn("[DeansList] Auto re-evaluation failed after student release:", dlErr)
      )
    }

    // Audit logging
    const subject = (schedule as Record<string, unknown> | null)?.subject ?? ""
    const section = (schedule as Record<string, unknown> | null)?.section ?? ""
    const student = await UserModel.findOne({ id: studentId }).lean()
    const studentName = (student as Record<string, unknown> | null)?.name as string ?? studentId
    
    const time = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " +
      new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    
    const actionText = action === "release"
      ? `Re-released ${period} grade for ${studentName} in ${subject} (${section})`
      : `Unreleased ${period} grade for ${studentName} in ${subject} (${section}) — Reason: ${reason?.trim()}`
    
    auditLogsRepository.create({
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actor: auth.user.name,
      action: actionText,
      time,
    }).catch(() => {})

    return success({ data: updated })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to process student release.")
  }
}
