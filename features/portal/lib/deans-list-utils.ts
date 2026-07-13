import { connectToDatabase } from "@/lib/mongodb"
import { DeansListModel, GradeModel, SemesterModel, UserModel, ScheduleModel, ClassStudentModel } from "@/lib/models"
import { evaluateDeansList } from "./deans-list-evaluator"
import { v4 as uuid } from "@/lib/uuid"
import { normalizeYearLevel } from "./year-level"

export async function recomputeDeansListForSemester(semesterId: string): Promise<void> {
  await connectToDatabase()

  const semester = await SemesterModel.findOne({ id: semesterId }).lean()
  if (!semester) return

  const schedules = await ScheduleModel.find({ semesterId }).lean()
  const semesterClassIds = schedules.map((s) => (s as unknown as Record<string, unknown>).id as string).filter(Boolean)

  const allGrades = await GradeModel.find({
    deletedAt: null,
    $or: [
      { semesterId },
      { classId: { $in: semesterClassIds } },
    ],
  }).lean()
  const studentsWithGrades = [...new Set(allGrades.map((g) => g.studentId))]

  const scheduleSections = schedules.map((s) => (s as unknown as Record<string, unknown>).section as string).filter(Boolean)
  const rosterStudents = scheduleSections.length > 0
    ? await ClassStudentModel.find({ enrolled: true, section: { $in: scheduleSections } }).lean()
    : []
  const rosterStudentIds = rosterStudents.map((r) => r.id)

  const allStudentIds = [...new Set([...studentsWithGrades, ...rosterStudentIds])]

  const users = await UserModel.find({
    id: { $in: allStudentIds },
    role: "student",
    deletedAt: null,
  }).lean()

  const semesterRecord = semester as unknown as Record<string, unknown>
  const semesterName = (semesterRecord.semester as string) ?? ""

  for (const user of users) {
    const yearLevel = normalizeYearLevel((user as unknown as Record<string, unknown>).currentYearLevel as string | undefined) ?? "Unknown"

    const userGrades = allGrades.filter((g) => g.studentId === user.id)

    // Deduplicate by code, preferring record with semesterId (newer/correct one)
    const deduped = new Map<string, (typeof userGrades)[0]>()
    for (const g of userGrades) {
      const key = ((g.code as string) ?? "").replace(/\s+/g, "").toLowerCase()
      const existing = deduped.get(key)
      if (!existing || (g.semesterId && !existing.semesterId)) {
        deduped.set(key, g)
      }
    }
    const uniqueGrades = [...deduped.values()]

    // Compute totalUnits from actual enrolled subjects (includes added subjects)
    const totalUnits = uniqueGrades.reduce((sum, g) => sum + ((g.units as number) ?? 0), 0)

    const evalGrades = uniqueGrades.map((g) => ({
      transmutedGrade: g.releasedTransmutedGrade ?? g.transmutedGrade,
      finalReleased: g.finalReleased,
      remarks: g.releasedRemarks ?? g.remarks,
      finalRemarks: g.releasedFinalRemarks ?? g.finalRemarks,
      midtermRemarks: g.releasedMidtermRemarks ?? g.midtermRemarks,
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
