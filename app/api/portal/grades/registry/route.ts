import { connectToDatabase } from "@/lib/mongodb"
import { UserModel } from "@/lib/models"
import { success, error } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    await connectToDatabase()
    const url = new URL(request.url)
    const studentId = url.searchParams.get("studentId")

    if (!studentId) {
      return error("studentId query parameter is required.", 400)
    }

    const user = await UserModel.findOne({ id: studentId }).lean()
    if (!user) return error("Student not found.", 404)

    return success({
      gradeHistory: (user as unknown as Record<string, unknown>).gradeHistory ?? [],
      semesterGwas: (user as unknown as Record<string, unknown>).semesterGwas ?? [],
    })
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch grade registry.")
  }
}
