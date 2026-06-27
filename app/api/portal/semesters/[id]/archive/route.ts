import { connectToDatabase } from "@/lib/mongodb"
import { GradeModel } from "@/lib/models"
import { semestersRepository } from "@/features/portal/repositories/semesters.repository"
import { schedulesRepository } from "@/features/portal/repositories/schedules.repository"
import { success, error, notFound } from "@/lib/api-response"
import { recomputeDeansListForSemester } from "@/features/portal/lib/deans-list-utils"

export const runtime = "nodejs"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectToDatabase()

    const semester = await semestersRepository.findOne({ id })
    if (!semester) return notFound("Semester")

    const schedules = await schedulesRepository.findAll({ semesterId: id })
    const pairs = new Set<string>()
    for (const s of (schedules as Array<Record<string, string>>)) {
      if (s.section && s.subject) {
        pairs.add(`${s.section}|${s.subject}`)
      }
    }

    if (pairs.size > 0) {
      const orConditions = Array.from(pairs).map((pair) => {
        const [section, subject] = pair.split("|")
        return { section, subject }
      })
      await GradeModel.updateMany(
        { $or: orConditions },
        { $set: { semesterId: id } }
      )
      await GradeModel.updateMany(
        { $or: orConditions, remarks: null },
        [
          {
            $set: {
              remarks: {
                $cond: [
                  { $lte: ["$transmutedGrade", 3] },
                  "Passed",
                  {
                    $cond: [
                      { $gt: ["$transmutedGrade", 3] },
                      "Failed",
                      null
                    ]
                  }
                ]
              }
            }
          }
        ],
        { updatePipeline: true }
      )
    }

    const updated = await semestersRepository.update({ id }, {
      status: "Archived",
      archivedAt: new Date().toISOString(),
    })

    try {
      await recomputeDeansListForSemester(id)
    } catch (dlErr) {
      console.warn("Dean's List auto-evaluation failed during archive:", dlErr)
    }

    return success(updated)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to archive semester.")
  }
}
