import { connectToDatabase } from "@/lib/mongodb"
import { DeansListModel, GradeModel, UserModel, SemesterModel, ScheduleModel, CurriculumModel } from "@/lib/models"
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

    const schedules = await ScheduleModel.find({ semesterId }).lean()
    const semesterClassIds = schedules.map((s) => (s as unknown as Record<string, unknown>).id as string).filter(Boolean)

    const allGrades = await GradeModel.find({
      deletedAt: null,
      $or: [
        { semesterId },
        { semesterId: { $exists: false }, classId: { $in: semesterClassIds } },
      ],
    }).lean()
    const curricula = await CurriculumModel.find({ status: "Active" }).lean()

    const studentsWithGrades = [
      ...new Set(allGrades.map((g) => g.studentId)),
    ]

    const users = await UserModel.find({
      id: { $in: studentsWithGrades },
      role: "student",
    }).lean()

    const entries: Array<Record<string, unknown>> = []
    const semesterRecord = semester as unknown as Record<string, unknown>
    const semesterName = (semesterRecord.semester as string) ?? ""

    for (const user of users) {
      const yearLevel = normalizeYearLevel((user as unknown as Record<string, unknown>).currentYearLevel as string | undefined) ?? "Unknown"

      const userGrades = allGrades.filter((g) => g.studentId === user.id)
      const userRecord = user as unknown as Record<string, unknown>
      const userCurriculumId = userRecord.curriculumId as string | undefined

      // Determine student's sections from their grade records
      const userSections = new Set(userGrades.map((g) => (g.section as string) ?? "").filter(Boolean))

      // Build expected subject codes from schedules matching student's sections
      const normalizeCode = (s: string) => s.replace(/\s+/g, "").toLowerCase()
      const expectedCodes = new Map<string, number>()

      for (const schedule of schedules) {
        const sched = schedule as unknown as Record<string, unknown>
        const section = (sched.section as string) ?? ""
        if (section && !userSections.has(section)) continue
        const code = ((sched.subject as string) ?? "").split(" - ")[0]?.trim()
        if (!code) continue
        expectedCodes.set(normalizeCode(code), 0)
      }

      // Add curriculum subjects for the student's year level and semester
      const curriculum = curricula.find((c) => (c as unknown as Record<string, unknown>).id === userCurriculumId)
      const curriculumTerm = (curriculum as { terms?: Array<{ year: string; semester: string; subjects: Array<{ code: string; total: number }> }> } | undefined)?.terms
        ?.find((t) => t.year === yearLevel && t.semester === semesterName)
      if (curriculumTerm) {
        for (const sub of curriculumTerm.subjects) {
          const key = normalizeCode(sub.code)
          if (!expectedCodes.has(key)) {
            expectedCodes.set(key, sub.total)
          } else if (expectedCodes.get(key) === 0) {
            expectedCodes.set(key, sub.total)
          }
        }
      }

      // Check if any expected subject has no grade record
      let hasMissingSubject = false
      for (const [code] of expectedCodes) {
        const hasGrade = userGrades.some((g) => {
          const gCode = ((g.code as string) ?? "").replace(/\s+/g, "").toLowerCase()
          return gCode === code
        })
        if (!hasGrade) {
          hasMissingSubject = true
          break
        }
      }

      // Compute totalUnits from actual enrolled subjects (includes added subjects)
      const totalUnits = userGrades.reduce((sum, g) => sum + ((g.units as number) ?? 0), 0)

      const evaluationGrades = userGrades.map((g) => ({
        transmutedGrade: g.transmutedGrade,
        finalReleased: g.finalReleased,
        remarks: g.remarks,
        finalRemarks: g.finalRemarks,
        midtermRemarks: g.midtermRemarks,
        units: g.units,
        subject: g.subject,
        code: g.code,
      }))

      let result: { isQualified: boolean; gwa: number | null; reasons: string[] }
      if (hasMissingSubject) {
        result = { isQualified: false, gwa: null, reasons: ["Not all grades have been released yet"] }
      } else {
        result = evaluateDeansList(evaluationGrades, totalUnits)
      }

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
