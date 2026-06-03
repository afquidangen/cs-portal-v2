import { yearSectionsRepository } from "@/features/portal/repositories/year-sections.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const yearSections = await yearSectionsRepository.findAll()
    return success(yearSections)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch year sections.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.year) {
      return badRequest("Year is required.")
    }
    const entry = await yearSectionsRepository.create(body)
    return success(entry, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create year section.")
  }
}
