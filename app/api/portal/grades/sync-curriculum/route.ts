import { connectToDatabase } from "@/lib/mongodb"
import { UserModel, CurriculumModel } from "@/lib/models"
import { success, error } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { findCurriculumSubjectPosition } from "@/features/portal/lib/grade-engine"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    await connectToDatabase()

    const body = await request.json().catch(() => ({}))
    const studentIdFilter = body.studentId as string | undefined

    const userFilter: Record<string, unknown> = { role: "student" }
    if (studentIdFilter) {
      userFilter.id = studentIdFilter
    }

    const students = await UserModel.find(userFilter).lean()
    if (!Array.isArray(students) || students.length === 0) {
      return success({ updated: 0, message: "No students found matching the filter." })
    }

    const curriculumCache = new Map<string, unknown>()
    let totalUpdated = 0
    let totalProcessed = 0

    for (const student of students) {
      const s = student as unknown as Record<string, unknown>
      const gradeHistory = (s.gradeHistory ?? []) as Array<Record<string, unknown>>
      if (gradeHistory.length === 0) continue

      const curriculumId = (s.curriculumId as string) ?? ""
      let curriculumTerms: unknown = null
      if (curriculumId) {
        if (curriculumCache.has(curriculumId)) {
          curriculumTerms = curriculumCache.get(curriculumId)
        } else {
          const curriculum = await CurriculumModel.findOne({ id: curriculumId }).lean()
          const terms = (curriculum as Record<string, unknown> | null)?.terms ?? null
          curriculumCache.set(curriculumId, terms)
          curriculumTerms = terms
        }
      }

      let changed = false
      for (let i = 0; i < gradeHistory.length; i++) {
        const entry = gradeHistory[i]
        const code = (entry.subjectCode as string) ?? ""

        const position = findCurriculumSubjectPosition(
          curriculumTerms as { terms: Array<{ year: string; semester: string; subjects: Array<{ code: string }> }> } | null,
          code
        )

        if (position) {
          if (entry.yearLevel !== position.yearLevel || entry.semester !== position.semester) {
            entry.yearLevel = position.yearLevel
            entry.semester = position.semester
            changed = true
          }
        }

        if (!entry.curriculumId && curriculumId) {
          entry.curriculumId = curriculumId
          changed = true
        }
      }

      if (changed) {
        await UserModel.updateOne(
          { id: s.id as string },
          { $set: { gradeHistory } }
        )
        totalUpdated++
      }
      totalProcessed++
    }

    return success({
      updated: totalUpdated,
      processed: totalProcessed,
      message: `Processed ${totalProcessed} students, updated ${totalUpdated} grade histories.`,
    })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to sync curriculum grades.")
  }
}
