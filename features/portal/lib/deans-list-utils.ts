import { connectToDatabase } from "@/lib/mongodb"
import { DeansListModel, GradeModel, SemesterModel, UserModel } from "@/lib/models"
import { evaluateDeansList } from "./deans-list-evaluator"
import { v4 as uuid } from "@/lib/uuid"
import { normalizeYearLevel } from "./year-level"

export async function recomputeDeansListForSemester(semesterId: string): Promise<void> {
  await connectToDatabase()

  const semester = await SemesterModel.findOne({ id: semesterId }).lean()
  if (!semester) return

  const allGrades = await GradeModel.find({ semesterId, deletedAt: null }).lean()
  const studentIds = [...new Set(allGrades.map((g) => g.studentId))]

  const users = await UserModel.find({
    id: { $in: studentIds },
    role: "student",
  }).lean()

  for (const user of users) {
    const yearLevel = normalizeYearLevel((user as unknown as Record<string, unknown>).currentYearLevel as string | undefined)
    if (!yearLevel) continue

    const userGrades = allGrades.filter((g) => g.studentId === user.id)
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

    const existingEntry = await DeansListModel.findOne({
      semesterId,
      studentId: user.id,
    }).lean()

    const existingOverride =
      (existingEntry as unknown as Record<string, unknown> | null)?.manualOverride ?? "none"

    if (existingOverride !== "none") continue

    const entryData = {
      gwa: result.gwa,
      totalUnits,
      isQualified: result.isQualified,
      disqualificationReasons: result.reasons,
      yearLevel,
    }

    if (existingEntry) {
      const wasPublished = (existingEntry as unknown as Record<string, unknown>).published === true
      const setData: Record<string, unknown> = { ...entryData }
      if (wasPublished) {
        setData.needsRecalculation = true
      }
      await DeansListModel.updateOne(
        { id: (existingEntry as unknown as Record<string, unknown>).id as string },
        { $set: setData }
      )
    } else {
      await DeansListModel.create({
        id: uuid(),
        studentId: user.id,
        studentName: user.name,
        semesterId,
        semester: (semester as unknown as Record<string, unknown>).semester as string ?? "",
        schoolYearStart: (semester as unknown as Record<string, unknown>).schoolYearStart as number ?? 0,
        schoolYearEnd: (semester as unknown as Record<string, unknown>).schoolYearEnd as number ?? 0,
        ...entryData,
        manualOverride: "none" as const,
        rank: null,
        published: false,
        publishedAt: null,
        needsRecalculation: false,
      })
    }
  }
}
