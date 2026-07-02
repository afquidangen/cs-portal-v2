import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { connectToDatabase } from "@/lib/mongodb"
import { UserModel } from "@/lib/models/user.model"
import { success, error, badRequest } from "@/lib/api-response"
import { GradeModel } from "@/lib/models/grade.model"

export const runtime = "nodejs"

export async function GET() {
  try {
    const grades = await gradesRepository.findAll()
    return success(grades)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch grades.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.studentId) {
      return badRequest("Grade id and studentId are required.")
    }
    await connectToDatabase()
    const user = await UserModel.findOne({ id: body.studentId }).select("role").lean()
    if (!user || user.role !== "student") {
      return badRequest("Only student accounts can be graded.")
    }

    const filter: Record<string, unknown> = { studentId: body.studentId, code: body.code }
    if (body.semesterId) filter.semesterId = body.semesterId

    const existing = await GradeModel.findOne(filter)
    if (existing) {
      existing.midterm = 0
      existing.finalTerm = 0
      existing.released = false
      existing.section = body.section
      existing.subject = body.subject
      existing.units = body.units
      existing.classId = body.classId
      existing.student = body.student
      existing.updatedAt = body.updatedAt
      existing.scores = new Map()
      existing.maxScores = new Map()
      existing.categoryGrades = []
      existing.lectureClassStanding = undefined
      existing.lectureExam = undefined
      existing.lectureGrade = undefined
      existing.laboratoryGrade = undefined
      existing.midtermGrade = undefined
      existing.tentativeFinalGrade = undefined
      existing.finalGrade = undefined
      existing.midtermTransmuted = undefined
      existing.finalTransmuted = undefined
      await existing.save()
      return success(existing)
    }

    const grade = await gradesRepository.create(body)
    return success(grade, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create grade.")
  }
}
