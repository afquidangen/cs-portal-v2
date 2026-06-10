import { connectToDatabase } from "@/lib/mongodb"
import { GradeModel, UserModel } from "@/lib/models"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

function transmutedToEquivalent(score: number): number {
  if (score >= 97) return 1.0
  if (score >= 94) return 1.25
  if (score >= 91) return 1.5
  if (score >= 88) return 1.75
  if (score >= 85) return 2.0
  if (score >= 82) return 2.25
  if (score >= 79) return 2.5
  if (score >= 76) return 2.75
  if (score >= 75) return 3.0
  if (score >= 72) return 4.0
  return 5.0
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { section, subject } = body
    if (!section || !subject) {
      return badRequest("section and subject are required.")
    }

    await connectToDatabase()
    const result = await GradeModel.updateMany(
      { section, subject },
      { $set: { released: true } }
    )

    const grades = await GradeModel.find({ section, subject, released: true }).lean()

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
        const midtermPct = (grade as Record<string, unknown>).midtermTransmuted as number ?? 0
        const finalPct = (grade as Record<string, unknown>).finalTransmuted as number ?? 0
        const gradePct = (grade as Record<string, unknown>).gradePercentage as number | undefined
        const finalPercentile = midtermPct || finalPct
          ? Number(((midtermPct + finalPct) / 2).toFixed(2))
          : 0
        const transmutedGrade = gradePct !== undefined
          ? transmutedToEquivalent(gradePct)
          : finalPercentile > 0
            ? transmutedToEquivalent(finalPercentile)
            : 0

        const existingIdx = history.findIndex(
          (h: Record<string, unknown>) => h.subjectCode === grade.code
        )

        const entry: Record<string, unknown> = {
          subjectCode: grade.code,
          subjectName: grade.subject,
          finalPercentile,
          transmutedGrade,
          remarks: (grade as Record<string, unknown>).remarks ?? "Passed",
          section: (grade as Record<string, unknown>).section,
        }

        if (existingIdx >= 0) {
          history[existingIdx] = { ...history[existingIdx] as Record<string, unknown>, ...entry }
        } else {
          history.push({
            ...entry,
            curriculumId: (user as Record<string, unknown>).curriculumId ?? "",
            yearLevel: (user as Record<string, unknown>).currentYearLevel ?? "",
            semester: (user as Record<string, unknown>).currentSemester ?? "",
          })
        }
        changed = true
      }

      if (changed) {
        await UserModel.updateOne({ id: studentId }, { $set: { gradeHistory: history } })
      }
    }

    return success({ modifiedCount: result.modifiedCount })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to release grades.")
  }
}
