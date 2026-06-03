import { auditLogsRepository } from "@/features/portal/repositories/audit-logs.repository"
import { success, error, badRequest } from "@/lib/api-response"

export const runtime = "nodejs"

export async function GET() {
  try {
    const logs = await auditLogsRepository.findAll()
    return success(logs)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to fetch audit logs.")
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.id || !body.actor) {
      return badRequest("Log id and actor are required.")
    }
    const log = await auditLogsRepository.create(body)
    return success(log, 201)
  } catch (err) {
    return error(err instanceof Error ? err.message : "Unable to create audit log.")
  }
}
