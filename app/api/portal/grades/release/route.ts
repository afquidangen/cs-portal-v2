import { connectToDatabase } from "@/lib/mongodb"
import { GradeModel, UserModel, ScheduleModel, SemesterModel, PushSubscriptionModel } from "@/lib/models"
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
    const { classId, gradingPeriod } = body
    if (!classId) {
      return badRequest("classId is required.")
    }

    await connectToDatabase()

    const grades = await GradeModel.find({ classId }).lean()
    if (grades.length === 0) {
      return success({ modifiedCount: 0, message: "No grades found for this class." })
    }

    const timestamp = new Date().toISOString()
    const releaseMidterm = gradingPeriod === "midterm" || gradingPeriod === "both" || !gradingPeriod
    const releaseFinal = gradingPeriod === "final" || gradingPeriod === "both" || !gradingPeriod

    for (const grade of grades) {
      const g = grade as unknown as Record<string, unknown>
      const setFields: Record<string, unknown> = { released: true }
      const pushFields: Record<string, unknown> = {}

      if (releaseMidterm) {
        setFields.midtermReleased = true
        setFields.releasedMidtermGrade = g.midtermGrade
        setFields.releasedMidtermTransmuted = g.midtermTransmuted
        setFields.releasedMidtermRemarks = g.midtermRemarks
        pushFields.midtermReleaseHistory = {
          action: (g.midtermReleased === true) ? "re-released" : "released",
          timestamp,
        }
      }

      if (releaseFinal) {
        setFields.finalReleased = true
        setFields.releasedTentativeFinalGrade = g.tentativeFinalGrade
        setFields.releasedFinalTransmuted = g.finalTransmuted
        setFields.releasedFinalRemarks = g.finalRemarks
        pushFields.finalReleaseHistory = {
          action: (g.finalReleased === true) ? "re-released" : "released",
          timestamp,
        }
      }

      const midtermReleased = releaseMidterm ? true : g.midtermReleased
      const finalReleased = releaseFinal ? true : g.finalReleased

      if (midtermReleased && finalReleased) {
        const rMidterm = (releaseMidterm ? g.midtermGrade : g.releasedMidtermGrade) as number | undefined
        const rFinal = (releaseFinal ? g.tentativeFinalGrade : g.releasedTentativeFinalGrade) as number | undefined

        if (rMidterm !== undefined && rFinal !== undefined) {
          const overallGrade = (rMidterm + rFinal) / 2
          const overallTransmuted = transmuteGrade(overallGrade)
          const overallRemarks = getGradeRemarks(overallTransmuted)
          setFields.releasedFinalGrade = overallGrade
          setFields.releasedTransmutedGrade = overallTransmuted
          setFields.releasedRemarks = overallRemarks
        }
      }

      const updateOps: Record<string, unknown> = { $set: setFields }
      if (Object.keys(pushFields).length > 0) {
        updateOps.$push = pushFields
      }

      await GradeModel.updateOne({ _id: g._id as string }, updateOps)
    }

    const studentMap = new Map<string, typeof grades>()
    for (const g of grades) {
      const list = studentMap.get(g.studentId) ?? []
      list.push(g)
      studentMap.set(g.studentId, list)
    }

    for (const [studentId, studentGrades] of studentMap) {
      const user = await UserModel.findOne({ id: studentId })
      if (!user) continue

      const history = user.gradeHistory ? [...user.gradeHistory] : []
      let changed = false

      for (const grade of studentGrades) {
        const g = grade as unknown as Record<string, unknown>
        const finalGrade = g.finalGrade as number | undefined
        const transmuted = finalGrade !== undefined ? transmuteGrade(finalGrade) : undefined
        const remarks = g.remarks ?? getGradeRemarks(transmuted ?? 5.0)

        const existingIdx = (history as Array<Record<string, unknown>>).findIndex(
          (h) => h.subjectCode === (g.code as string)
        )

        const entry: Record<string, unknown> = {
          subjectCode: g.code,
          subjectName: g.subject,
          finalPercentile: finalGrade ?? 0,
          transmutedGrade: transmuted ?? 0,
          remarks,
          section: g.section,
        }

        if (existingIdx >= 0) {
          (history as Array<Record<string, unknown>>)[existingIdx] = { ...(history as Array<Record<string, unknown>>)[existingIdx], ...entry }
        } else {
          const u = user as unknown as Record<string, unknown>
          entry.curriculumId = (u.curriculumId as string) ?? ""
          entry.yearLevel = (u.currentYearLevel as string) ?? ""
          entry.semester = (u.currentSemester as string) ?? ""
          ;(history as Array<Record<string, unknown>>).push(entry)
        }
        changed = true
      }

      if (changed) {
        await UserModel.updateOne({ id: studentId }, { $set: { gradeHistory: history } })
      }
    }

    const updatedGrades = await GradeModel.find({ classId, studentId: { $in: grades.map((g) => g.studentId) } }).lean()

    const schedule = await ScheduleModel.findOne({ id: classId }).lean()
    if (schedule?.semesterId) {
      recomputeDeansListForSemester(schedule.semesterId).catch((dlErr) =>
        console.warn("[DeansList] Auto re-evaluation failed after release:", dlErr)
      )
    }

    // Audit logging
    const subject = (schedule as Record<string, unknown> | null)?.subject ?? ""
    const section = (schedule as Record<string, unknown> | null)?.section ?? ""
    const gradingPeriodLabel = gradingPeriod === "midterm" ? "Midterm" : gradingPeriod === "final" ? "Final" : "Midterm & Final"
    
    const time = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " +
      new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    
    auditLogsRepository.create({
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      actor: auth.user.name,
      action: `Released ${gradingPeriodLabel} grades for ${subject} (${section}) — ${grades.length} student(s)`,
      time,
    }).catch(() => {})

    Promise.resolve().then(async () => {
      try {
        const semester = schedule?.semesterId
          ? await SemesterModel.findOne({ id: schedule.semesterId }).lean()
          : null

        const semesterName = (semester as Record<string, unknown> | null)?.semester as string ?? ""
        const syStart = (semester as Record<string, unknown> | null)?.schoolYearStart as number ?? 0
        const syEnd = (semester as Record<string, unknown> | null)?.schoolYearEnd as number ?? 0
        const facultyName = (schedule as Record<string, unknown> | null)?.instructor as string | undefined

        const emailPromises = Array.from(studentMap.entries()).map(
          async ([studentId]) => {
            const user = await UserModel.findOne({ id: studentId })
            if (!user?.email) return

            await sendGradeReleasedEmail({
              studentId,
              studentName: user.name,
              email: user.email,
              semester: semesterName,
              schoolYearStart: syStart,
              schoolYearEnd: syEnd,
              facultyName,
            })
          },
        )

        const results = await Promise.allSettled(emailPromises)
        const failed = results.filter((r) => r.status === "rejected")
        if (failed.length > 0) {
          console.warn(
            `[Email] ${failed.length} grade release email(s) failed to send`,
          )
        }

      } catch (emailErr) {
        console.warn("[Notification] Grade release email error:", emailErr)
      }

      try {
        const studentIds = Array.from(studentMap.keys())
        if (studentIds.length > 0) {
          const students = await UserModel.find({ id: { $in: studentIds } })
            .lean()
            .select("id pushNotificationsEnabled")

          const pushTargetIds = students
            .filter((s) => s.pushNotificationsEnabled !== false)
            .map((s) => s.id)

          if (pushTargetIds.length > 0) {
            const subscriptions = await PushSubscriptionModel.find({
              userId: { $in: pushTargetIds },
            }).lean()

            if (subscriptions.length > 0) {
              const gradingPeriodLabel =
                gradingPeriod === "midterm"
                  ? "Midterm"
                  : gradingPeriod === "final"
                    ? "Final"
                    : "Midterm & Final"

              const subjectList =
                (schedule as Record<string, unknown> | null)?.subject ?? ""

              await sendPushToSubscriptions(
                subscriptions as Array<{
                  id: string
                  userId: string
                  endpoint: string
                  p256dhKey: string
                  authKey: string
                }>,
                {
                  title: "Student Portal",
                  body: `Your ${gradingPeriodLabel} grade${gradingPeriod === "both" ? "s" : ""} for ${subjectList} ${subjectList ? "have" : "has"} been released.`,
                  icon: "/logo-source.svg",
                  url: "/student",
                },
              )
            }
          }
        }
      } catch (pushErr) {
        console.warn("[Notification] Grade release push error:", pushErr)
      }
    })

    return success({ modifiedCount: grades.length, grades: updatedGrades })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to release grades.")
  }
}
