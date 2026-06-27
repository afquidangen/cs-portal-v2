import { connectToDatabase } from "@/lib/mongodb"
import { DeansListModel, GradeModel, UserModel, SemesterModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"
import { requireAdmin } from "@/lib/api-auth"
import { evaluateDeansList } from "@/features/portal/lib/deans-list-evaluator"
import { v4 as uuid } from "@/lib/uuid"
import { normalizeYearLevel } from "@/features/portal/lib/year-level"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const url = new URL(request.url)
    const semesterId = url.searchParams.get("semesterId")
    if (!semesterId) return badRequest("semesterId is required.")

    await connectToDatabase()
    const entries = await DeansListModel.find({ semesterId }).lean()

    return success(entries)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch Dean's List entries.")
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json() as { semesterId: string }
    const { semesterId } = body
    if (!semesterId) return badRequest("semesterId is required.")

    await connectToDatabase()

    const semester = await SemesterModel.findOne({ id: semesterId }).lean()
    if (!semester) return badRequest("Semester not found.")

    const allGrades = await GradeModel.find({
      semesterId,
      deletedAt: null,
    }).lean()

    const studentsWithGrades = [
      ...new Set(allGrades.map((g) => g.studentId)),
    ]

    const users = await UserModel.find({
      id: { $in: studentsWithGrades },
      role: "student",
    }).lean()

    const entries: Array<Record<string, unknown>> = []

    for (const user of users) {
      const yearLevel = normalizeYearLevel((user as unknown as Record<string, unknown>).currentYearLevel as string | undefined)
      if (!yearLevel) continue

      const userGrades = allGrades.filter((g) => g.studentId === user.id)

      const totalUnits = userGrades.reduce(
        (sum, g) => sum + ((g.units as number) ?? 0),
        0
      )

      const evaluationGrades = userGrades.map((g) => ({
        transmutedGrade: g.transmutedGrade,
        released: g.released,
        remarks: g.remarks,
        finalRemarks: g.finalRemarks,
        midtermRemarks: g.midtermRemarks,
        units: g.units,
        subject: g.subject,
        code: g.code,
      }))

      const result = evaluateDeansList(evaluationGrades, totalUnits)

      const existingEntry = await DeansListModel.findOne({
        semesterId,
        studentId: user.id,
      }).lean()

      const manualOverride =
        ((existingEntry as unknown as Record<string, unknown> | null)?.manualOverride as string) ?? "none"

      if (manualOverride !== "none") {
        entries.push({
          id: existingEntry!.id,
          studentId: user.id,
          studentName: user.name,
          semesterId,
          semester: semester.semester,
          schoolYearStart: semester.schoolYearStart,
          schoolYearEnd: semester.schoolYearEnd,
          gwa: result.gwa,
          totalUnits,
          yearLevel,
          isQualified: existingEntry!.isQualified,
          disqualificationReasons: existingEntry!.disqualificationReasons,
          manualOverride,
          rank: existingEntry!.rank,
          published: existingEntry!.published,
          publishedAt: existingEntry!.publishedAt,
        })
        continue
      }

      const entryData = {
        gwa: result.gwa,
        totalUnits,
        isQualified: result.isQualified,
        disqualificationReasons: result.reasons,
        yearLevel,
        needsRecalculation: false,
      }

      if (existingEntry) {
        await DeansListModel.updateOne(
          { id: existingEntry.id },
          { $set: entryData }
        )
        entries.push({
          id: existingEntry.id,
          ...entryData,
          studentId: user.id,
          studentName: user.name,
          semesterId,
          semester: semester.semester,
          schoolYearStart: semester.schoolYearStart,
          schoolYearEnd: semester.schoolYearEnd,
          manualOverride: "none",
          rank: null,
          published: false,
          publishedAt: null,
        })
      } else {
        const id = uuid()
        const newEntry = {
          id,
          studentId: user.id,
          studentName: user.name,
          semesterId,
          semester: semester.semester,
          schoolYearStart: semester.schoolYearStart,
          schoolYearEnd: semester.schoolYearEnd,
          ...entryData,
          manualOverride: "none" as const,
          rank: null,
          published: false,
          publishedAt: null,
        }
        await DeansListModel.create(newEntry as Record<string, unknown>)
        entries.push(newEntry)
      }
    }

    return success(entries)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to compute Dean's List.")
  }
}
