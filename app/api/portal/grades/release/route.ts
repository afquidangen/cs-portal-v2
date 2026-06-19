import { connectToDatabase } from "@/lib/mongodb"
import { GradeModel, UserModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"
import { transmuteGrade, getGradeRemarks } from "@/features/portal/lib/grade-engine"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { classId, gradingPeriod } = body
    if (!classId) {
      return badRequest("classId is required.")
    }

    await connectToDatabase()

    const filter: Record<string, unknown> = { classId }
    if (gradingPeriod === "midterm") filter.midtermReleased = { $ne: true }
    if (gradingPeriod === "final") filter.finalReleased = { $ne: true }

    const grades = await GradeModel.find(filter).lean()
    if (grades.length === 0) {
      return success({ modifiedCount: 0, message: "All grades already released for this period." })
    }

    const setFields: Record<string, unknown> = { released: true }
    const timestamp = new Date().toISOString()
    const historyEntry = { action: "released", timestamp }

    if (gradingPeriod === "midterm") {
      setFields.midtermReleased = true
      await GradeModel.updateMany(filter, {
        $set: setFields,
        $push: { midtermReleaseHistory: historyEntry },
      })
    } else if (gradingPeriod === "final") {
      setFields.finalReleased = true
      await GradeModel.updateMany(filter, {
        $set: setFields,
        $push: { finalReleaseHistory: historyEntry },
      })
    } else {
      setFields.midtermReleased = true
      setFields.finalReleased = true
      await GradeModel.updateMany(filter, {
        $set: setFields,
        $push: { midtermReleaseHistory: historyEntry, finalReleaseHistory: historyEntry },
      })
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
    return success({ modifiedCount: grades.length, grades: updatedGrades })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to release grades.")
  }
}
