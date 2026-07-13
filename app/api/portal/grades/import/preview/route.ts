import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { gradeColumnRepository } from "@/features/portal/repositories/grade-column.repository"
import { usersRepository } from "@/features/portal/repositories/users.repository"
import { gradingSchemeRepository } from "@/features/portal/repositories/grading-scheme.repository"
import { importTemplate, sortGradesForImport } from "@/features/portal/lib/import-template-engine"
import crypto from "crypto"
import { ScheduleModel, ClassStudentModel, CurriculumModel } from "@/lib/models"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const formData = await request.formData()
    const classId = formData.get("classId") as string | null
    const file = formData.get("file") as File | null

    if (!classId) return badRequest("classId is required.")
    if (!file) return badRequest("File is required.")

    const buffer = await file.arrayBuffer()

    const columns = (await gradeColumnRepository.findByClass(classId)) as any[]
    let grades = (await gradesRepository.findAll({ classId })) as any[]

    // Always fetch schedule + roster for diagnostics
    const schedule = await ScheduleModel.findOne({ id: classId }).lean()
    const rosterSection = schedule?.section ?? ""
    let rosterCount = 0
    let roster: any[] = []
    if (schedule) {
      roster = await ClassStudentModel.find({
        section: schedule.section,
        enrolled: true,
        deletedAt: null,
      }).lean()
      rosterCount = roster.length
    }

    // Auto-create grade records for roster students missing from grades
    // (handles both empty grades and partially-populated grades)
    if (schedule && roster.length > 0) {
      const gradeStudentIds = new Set(
        grades.map((g: any) => g.studentId).filter(Boolean)
      )
      const section = schedule.section
      const subjectCode = schedule.subject.split(" - ")[0]?.trim() ?? schedule.subject
      const now = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })

      for (const student of roster) {
        if (!gradeStudentIds.has(student.id)) {
          await gradesRepository.create({
            id: `GRD-${crypto.randomUUID().slice(0, 8)}`,
            studentId: student.id,
            student: student.name,
            section,
            subject: schedule.subject,
            code: subjectCode,
            units: 3,
            classId,
            semesterId: schedule.semesterId,
            scores: {},
            released: false,
            updatedAt: now,
          })
        }
      }

      // Re-fetch grades if any were created
      if (grades.length !== roster.length) {
        grades = (await gradesRepository.findAll({ classId })) as any[]
      }
    }

    // Build sort keys matching export order (by last name)
    const studentIds = [...new Set(grades.map((g: any) => g.studentId).filter(Boolean))] as string[]
    const studentSortKeys = new Map<string, string>()
    if (studentIds.length > 0) {
      const students = (await usersRepository.findAll({ id: { $in: studentIds } })) as Array<{
        id: string
        lastName?: string
        name?: string
      }>
      for (const s of students) {
        const key = (s.lastName ?? s.name?.split(" ").pop() ?? "").toLowerCase()
        studentSortKeys.set(s.id, key)
      }
    }

    const sortedGrades = sortGradesForImport(grades as any[], studentSortKeys)

    // Determine subject type from curriculum (matching grid logic), not from grade defaults
    const code = schedule?.subject.split(" - ")[0]?.trim() ?? ""
    let subjectType: "Lecture" | "Lecture with Lab" = "Lecture"
    if (schedule?.curriculumId && code) {
      const curriculum = await CurriculumModel.findOne({ id: schedule.curriculumId }).lean() as { terms?: Array<{ subjects: Array<{ code: string; name: string; lab: number }> }> } | null
      const foundLab = curriculum?.terms?.some((t) =>
        t.subjects.some((s) =>
          s.lab > 0 && ((s.code && code.includes(s.code)) || (s.name && code.includes(s.name)))
        )
      ) ?? false
      if (foundLab) subjectType = "Lecture with Lab"
    }
    const scheme = await gradingSchemeRepository.findActiveBySubjectType(subjectType)

    const { preview } = await importTemplate(
      classId,
      buffer,
      sortedGrades as any[],
      columns as any[],
      scheme as any
    )

    return success({
      importToken: preview.importToken,
      gradeCount: grades.length,
      rosterSection,
      rosterCount,
      studentsInFile: preview.studentsInFile,
      studentsMatched: preview.studentsMatched,
      studentsSkipped: preview.studentsSkipped,
      scoreUpdates: preview.scoreUpdates,
      newColumns: preview.newColumns,
      warnings: preview.warnings,
      diagnostic: preview.diagnostic,
    })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to preview import.")
  }
}
