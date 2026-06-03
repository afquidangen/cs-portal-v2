import { csoReportsRepository } from "@/features/portal/repositories/cso-reports.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const reports = await csoReportsRepository.findAll()
    return success(reports)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch CSO reports.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.title) {
      return badRequest("Report id and title are required.")
    }
    const report = await csoReportsRepository.create(body)
    return success(report, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create CSO report.")
  }
}
