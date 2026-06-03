import { semestersRepository } from "@/features/portal/repositories/semesters.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const semesters = await semestersRepository.findAll()
    return success(semesters)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch semesters.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.semester) {
      return badRequest("Semester id and semester are required.")
    }
    const semester = await semestersRepository.create(body)
    return success(semester, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create semester.")
  }
}
