import { gradesRepository } from "@/features/portal/repositories/grades.repository"
import { connectToDatabase } from "@/lib/mongodb"
import { UserModel } from "@/lib/models/user.model"
import { success, error, badRequest } from "@/lib/api-response"

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
    const grade = await gradesRepository.create(body)
    return success(grade, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create grade.")
  }
}
