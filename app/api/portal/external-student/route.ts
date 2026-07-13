import { success, error, badRequest } from "@/lib/api-response"
import { requireFacultyOrAdmin } from "@/lib/api-auth"
import { rosterRepository } from "@/features/portal/repositories/roster.repository"
import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import crypto from "crypto"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const auth = await requireFacultyOrAdmin(request)
    if (auth instanceof Response) return auth

    const body = await request.json()
    const { lastName, firstName, middleName, sex, section, subject, subjectCode, classId, semesterId } = body

    if (!lastName || !firstName || !section || !subject || !subjectCode || !classId) {
      return badRequest("lastName, firstName, section, subject, subjectCode, and classId are required.")
    }

    const now = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    const middle = middleName?.trim() ? ` ${middleName.trim()}` : ""
    const name = `${lastName.trim()}, ${firstName.trim()}${middle}`

    const studentId = `STU-${crypto.randomUUID().slice(0, 8)}`
    const gradeId = `GRD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    const rosterEntry = {
      id: studentId,
      name,
      section,
      enrolled: true,
      sex: sex || null,
    }
    await rosterRepository.create(rosterEntry)

    const gradeEntry = {
      id: gradeId,
      studentId,
      student: name,
      section,
      subject,
      code: subjectCode,
      units: 3,
      classId,
      semesterId: semesterId || null,
      scores: {},
      released: false,
      updatedAt: now,
    }
    await gradesRepository.create(gradeEntry)

    return success({ studentId, gradeId, name }, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create external student.")
  }
}
