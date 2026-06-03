import { quickLinksRepository } from "@/features/portal/repositories/quick-links.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const links = await quickLinksRepository.findAll()
    return success(links)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch quick links.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.label || !body.href) {
      return badRequest("Label and href are required.")
    }
    const link = await quickLinksRepository.create(body)
    return success(link, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create quick link.")
  }
}
