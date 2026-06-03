import { facultyRepository } from "@/features/portal/repositories/faculty.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const faculty = await facultyRepository.findAll()
    return success(faculty)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch faculty.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.name) {
      return badRequest("Faculty id and name are required.")
    }
    const entry = await facultyRepository.create(body)
    return success(entry, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create faculty.")
  }
}
